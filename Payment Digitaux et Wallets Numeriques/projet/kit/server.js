"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { URL } = require("url");
const { buildMpm, decodeMpm } = require("./emv-mpm");
const PORT = 3789;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
const JOURNAL = path.join(DATA, "journal.json");
const TOKENS = path.join(DATA, "tokens.json");
const EVENTS = path.join(DATA, "events.json");

const DEMO_CARDS = {
  "4111111111111111": { brand: "VISA-DEMO", last4: "1111", force: "approve" },
  "4000000000000002": { brand: "VISA-DEMO", last4: "0002", force: "decline" },
  "5555555555554444": { brand: "MC-DEMO", last4: "4444", force: "approve" },
};

function ensureData() {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(JOURNAL)) fs.writeFileSync(JOURNAL, "[]\n", "utf8");
  if (!fs.existsSync(TOKENS)) fs.writeFileSync(TOKENS, "{}\n", "utf8");
  if (!fs.existsSync(EVENTS)) fs.writeFileSync(EVENTS, "[]\n", "utf8");
}

function lanAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets || {})) {
    for (const net of nets[name] || []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal) continue;
      out.push({ iface: name, address: net.address });
    }
  }
  return out;
}

function appendEvent(ev) {
  const events = readJson(EVENTS, []);
  events.unshift({
    id: uid("EV"),
    at: new Date().toISOString(),
    ...ev,
  });
  writeJson(EVENTS, events.slice(0, 800));
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function maskPan(pan) {
  const d = String(pan).replace(/\D/g, "");
  if (d.length < 4) return "****";
  return `**** **** **** ${d.slice(-4)}`;
}

/** Cryptogramme dynamique mock (idée ARQC / wallet crypto) */
function mockCryptogram() {
  const hex = "ABCDEF0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += hex[Math.floor(Math.random() * hex.length)];
  return out;
}

/** Payload QR credentials wallet (à scanner — DPAN/crypto masqués à l’écran) */
function buildWalletCredPayload(dpan, cryptogram) {
  return `PDWNWALLET|v1|dpan=${dpan}|crypt=${String(cryptogram).toUpperCase()}`;
}

function parseWalletCredPayload(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/^PDWNWALLET\|v1\|dpan=([^|]+)\|crypt=([A-Fa-f0-9]+)$/);
  if (!m) return null;
  return { dpan: m[1].trim(), cryptogram: m[2].trim().toUpperCase() };
}

function appendJournal(entry) {
  const journal = readJson(JOURNAL, []);
  journal.unshift(entry);
  writeJson(JOURNAL, journal.slice(0, 200));
  appendEvent({
    type: "journal_tx",
    channel: entry.channel,
    txId: entry.id,
    auth: entry.auth,
    amount: entry.amount,
    hasStudentAnswer: Boolean(entry.studentAnswer),
  });
  return entry;
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload =
    Buffer.isBuffer(body) || typeof body === "string"
      ? body
      : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[ext] || "application/octet-stream"
  );
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, service: "pdwn-mock-gateway", port: PORT });
  }

  if (req.method === "GET" && url.pathname === "/api/runtime") {
    const lans = lanAddresses();
    return send(res, 200, {
      port: PORT,
      lanAddresses: lans,
      phoneUrls: lans.map((x) => `http://${x.address}:${PORT}`),
    });
  }

  if (req.method === "GET" && url.pathname === "/api/export") {
    const student = String(url.searchParams.get("student") || "").trim();
    const now = new Date();
    const journal = readJson(JOURNAL, []);
    const events = readJson(EVENTS, []);
    const tokens = Object.values(readJson(TOKENS, {})).map((t) => ({
      dpan: t.dpan,
      walletId: t.walletId,
      brand: t.brand,
      panMasked: t.panMasked,
      status: t.status,
      provisionedAt: t.provisionedAt,
      lastPaidAt: t.lastPaidAt || null,
    }));
    const counts = {
      journal: journal.length,
      events: events.length,
      tokens: tokens.length,
      answers: journal.filter((t) => t.studentAnswer).length,
    };
    // Empreinte du contenu métier (hors nom étudiant / horodatage export)
    // → même journal copié par 2 binômes = même contentHash
    const contentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ journal, tokens }))
      .digest("hex");
    const pack = {
      format: "pdwn-projet-logs-v2",
      exportedAt: now.toISOString(),
      exportedAtLocal: now.toLocaleString("fr-FR", { timeZoneName: "short" }),
      exportId: uid("EXP"),
      contentHash,
      student: student || null,
      port: PORT,
      lanAddresses: lanAddresses(),
      journal,
      events,
      tokens,
      counts,
    };
    appendEvent({
      type: "export_logs",
      student: student || null,
      counts: pack.counts,
      contentHash,
      exportId: pack.exportId,
    });
    return send(res, 200, pack);
  }

  if (req.method === "GET" && url.pathname === "/api/journal") {
    return send(res, 200, { journal: readJson(JOURNAL, []) });
  }

  if (req.method === "POST" && url.pathname === "/api/journal/reset") {
    writeJson(JOURNAL, []);
    appendEvent({ type: "journal_reset" });
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/journal/answer") {
    const body = await readBody(req);
    const txId = String(body.txId || "").trim();
    if (!txId) return send(res, 400, { error: "txId manquant" });
    const journal = readJson(JOURNAL, []);
    const idx = journal.findIndex((t) => t.id === txId);
    if (idx < 0) return send(res, 404, { error: "Transaction introuvable dans le journal" });
    const tx = journal[idx];
    let answer;
    if (tx.channel === "card") {
      answer = {
        quiz: "card",
        at: new Date().toISOString(),
        auth: String(body.auth || ""),
        clearing: String(body.clearing || ""),
        settlement: String(body.settlement || ""),
        path: String(body.path || ""),
        expected: {
          auth: tx.auth,
          clearing: tx.stages && tx.stages.clearing,
          settlement: tx.stages && tx.stages.settlement,
          path: "pos-psp-scheme-issuer",
        },
      };
    } else if (tx.channel === "wallet_token") {
      answer = {
        quiz: "wallet",
        at: new Date().toISOString(),
        presentedType: String(body.presentedType || ""),
        credential: String(body.credential || ""),
        panInClear: String(body.panInClear || ""),
        path: String(body.path || ""),
        expected: {
          presentedType: "token",
          credential: "dpan",
          panInClear: "no",
          path: "wallet-tsp-scheme-issuer",
        },
      };
    } else {
      return send(res, 400, {
        error: "Réponse prévue pour une transaction carte ou wallet_token",
      });
    }
    journal[idx] = { ...tx, studentAnswer: answer };
    writeJson(JOURNAL, journal);
    appendEvent({
      type: "student_answer",
      quiz: answer.quiz,
      txId,
      channel: tx.channel,
      answer,
    });
    return send(res, 200, { ok: true, transaction: journal[idx] });
  }

  if (req.method === "GET" && url.pathname === "/api/demo-cards") {
    return send(res, 200, {
      cards: Object.entries(DEMO_CARDS).map(([pan, meta]) => ({
        pan,
        masked: maskPan(pan),
        brand: meta.brand,
        expected: meta.force,
      })),
    });
  }

  if (req.method === "POST" && url.pathname === "/api/qr/create") {
    const body = await readBody(req);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return send(res, 400, { error: "Montant invalide" });
    }
    const ref = uid("QR");
    const payload = buildMpm({ amount, ref });
    const decoded = decodeMpm(payload);
    return send(res, 200, {
      ref,
      amount,
      currency: "EUR",
      currencyNumeric: "978",
      mode: "MPM",
      poiMethod: "12",
      payload,
      decoded,
      hint:
        "EMV QR MPM dynamique (tag 01=12) — marchand présente, téléphone scanne. CRC ID 63 inclus.",
    });
  }

  if (req.method === "POST" && url.pathname === "/api/qr/decode") {
    const body = await readBody(req);
    const decoded = decodeMpm(body.payload);
    if (!decoded.crcOk) {
      return send(res, 400, { error: "CRC EMV invalide (ID 63)", decoded });
    }
    return send(res, 200, { ok: true, decoded });
  }

  if (req.method === "POST" && url.pathname === "/api/pay/qr") {
    const body = await readBody(req);
    const payload = String(body.payload || "");
    const decoded = decodeMpm(payload);
    if (!decoded.crcOk || decoded.payloadFormat !== "01") {
      return send(res, 400, {
        error: "Payload QR invalide — attendu EMV QR MPM (TLV + CRC)",
        decoded,
      });
    }
    if (!Number.isFinite(decoded.amount) || decoded.amount <= 0) {
      return send(res, 400, { error: "Montant (ID 54) manquant ou invalide" });
    }
    const ref = decoded.billNumber || uid("QR");
    const entry = appendJournal({
      id: uid("TX"),
      at: new Date().toISOString(),
      channel: "qr",
      amount: decoded.amount,
      currency: decoded.currency === "978" ? "EUR" : decoded.currency || "EUR",
      auth: "approve",
      presented: {
        type: "emv_mpm",
        mode: "MPM",
        poiMethod: decoded.poiMethod,
        guid: decoded.guid,
        merchantName: decoded.merchantName,
        billNumber: ref,
        payload,
      },
      stages: {
        authorization: "approve",
        clearing: "pending",
        settlement: "pending",
      },
      note: "Canal QR MPM — marchand présente · AuthZ mock approve (PSP client pédagogique)",
    });
    return send(res, 200, { ok: true, transaction: entry, decoded });
  }

  if (req.method === "POST" && url.pathname === "/api/pay/card") {
    const body = await readBody(req);
    const pan = String(body.pan || "").replace(/\s+/g, "");
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return send(res, 400, { error: "Montant invalide" });
    }
    const card = DEMO_CARDS[pan];
    if (!card) {
      return send(res, 400, {
        error: "PAN inconnu — utilisez une carte de démo du kit",
      });
    }
    const auth = card.force;
    const clearing = auth === "approve" ? "pending" : "n/a";
    const settlement = auth === "approve" ? "pending" : "n/a";
    const path =
      auth === "approve"
        ? [
            "POS / caisse (mock)",
            "Acquéreur / PSP",
            "Scheme",
            "Émetteur (AuthZ approve)",
            "Retour réponse → POS",
            "Clearing (pending) → Settlement (pending)",
          ]
        : [
            "POS / caisse (mock)",
            "Acquéreur / PSP",
            "Scheme",
            "Émetteur (AuthZ decline)",
            "Retour decline → POS",
            "Pas de clearing / settlement",
          ];
    const entry = appendJournal({
      id: uid("TX"),
      at: new Date().toISOString(),
      channel: "card",
      amount,
      currency: "EUR",
      auth,
      presented: {
        type: "pan_masked",
        brand: card.brand,
        masked: maskPan(pan),
      },
      stages: {
        authorization: auth,
        clearing,
        settlement,
      },
      path,
      note:
        auth === "approve"
          ? "Canal carte — PAN masqué en journal ; AuthZ approve · lire path + stages"
          : "Canal carte — AuthZ decline · lire path + stages (clearing/settlement = n/a)",
    });
    return send(res, 200, { ok: auth === "approve", transaction: entry });
  }

  if (req.method === "POST" && url.pathname === "/api/token/provision") {
    const body = await readBody(req);
    const pan = String(body.pan || "").replace(/\s+/g, "");
    const walletId = String(body.walletId || "wallet-demo").trim();
    const card = DEMO_CARDS[pan];
    if (!card) {
      return send(res, 400, { error: "PAN inconnu — carte de démo uniquement" });
    }
    if (card.force === "decline") {
      return send(res, 400, {
        error: "Cette carte de démo n’est pas éligible à l’enrolment — essayez une autre",
      });
    }
    const dpan = `DPAN${pan.slice(-4)}${Math.floor(Math.random() * 9000 + 1000)}`;
    const cryptogram = mockCryptogram();
    const tokens = readJson(TOKENS, {});
    const record = {
      dpan,
      cryptogram,
      walletId,
      brand: card.brand,
      panMasked: maskPan(pan),
      status: "active",
      provisionedAt: new Date().toISOString(),
      note:
        "Mock TSP : DPAN (Device PAN) + cryptogramme dynamique — le PAN n’est pas renvoyé au POS",
    };
    tokens[dpan] = record;
    writeJson(TOKENS, tokens);
    const credPayload = buildWalletCredPayload(dpan, cryptogram);
    appendEvent({
      type: "token_provision",
      dpan,
      walletId,
      brand: card.brand,
      panMasked: maskPan(pan),
    });
    return send(res, 200, {
      ok: true,
      token: record,
      credPayload,
      definitions: {
        DPAN: "Device Primary Account Number — PAN tokenisé lié au device / wallet (pas le PAN carte)",
        cryptogram:
          "Cryptogramme dynamique (mock type ARQC) — prouve une présentation fraîche du token",
      },
    });
  }

  if (req.method === "POST" && url.pathname === "/api/wallet/parse-cred") {
    const body = await readBody(req);
    const parsed = parseWalletCredPayload(body.payload);
    if (!parsed) {
      return send(res, 400, {
        error: "Payload invalide — attendu PDWNWALLET|v1|dpan=…|crypt=…",
      });
    }
    return send(res, 200, { ok: true, ...parsed });
  }

  if (req.method === "GET" && url.pathname === "/api/tokens") {
    return send(res, 200, { tokens: Object.values(readJson(TOKENS, {})) });
  }

  if (req.method === "POST" && url.pathname === "/api/pay/wallet") {
    const body = await readBody(req);
    const dpan = String(body.dpan || "").trim();
    const cryptogram = String(body.cryptogram || body.crypt || "").trim().toUpperCase();
    const amount = Number(body.amount);
    const source = String(body.source || "unknown");
    if (!Number.isFinite(amount) || amount <= 0) {
      return send(res, 400, { error: "Montant invalide" });
    }
    if (!cryptogram) {
      return send(res, 400, { error: "Cryptogramme requis (avec le DPAN)" });
    }
    const tokens = readJson(TOKENS, {});
    const token = tokens[dpan];
    if (!token || token.status !== "active") {
      return send(res, 400, { error: "Token inconnu ou inactif — provisionnez d’abord" });
    }
    const cryptoOk = String(token.cryptogram || "").toUpperCase() === cryptogram;
    const auth = cryptoOk ? "approve" : "decline";
    const path = cryptoOk
      ? [
          "Wallet / device présente DPAN + cryptogramme",
          "TSP / token requestor (mock)",
          "Scheme",
          "Émetteur (AuthZ approve — crypto OK)",
          "Retour → acceptation",
          "Clearing (pending) → Settlement (pending)",
        ]
      : [
          "Wallet / device présente DPAN + cryptogramme",
          "TSP / token requestor (mock)",
          "Scheme",
          "Émetteur (AuthZ decline — crypto invalide / rejoué)",
          "Retour decline → acceptation",
          "Pas de clearing / settlement",
        ];
    const entry = appendJournal({
      id: uid("TX"),
      at: new Date().toISOString(),
      channel: "wallet_token",
      amount,
      currency: "EUR",
      auth,
      presented: {
        type: "token",
        dpan: token.dpan,
        cryptogram: cryptogram.slice(0, 4) + "…",
        walletId: token.walletId,
        brand: token.brand,
        source,
      },
      stages: {
        authorization: auth,
        clearing: auth === "approve" ? "pending" : "n/a",
        settlement: auth === "approve" ? "pending" : "n/a",
      },
      path,
      note: cryptoOk
        ? "Canal wallet — DPAN + crypto présentés ; pas de PAN en clair · lire path + presented"
        : "Canal wallet — cryptogramme refusé (mock) · lire path + stages",
    });
    if (cryptoOk) {
      token.cryptogram = mockCryptogram();
      token.lastPaidAt = new Date().toISOString();
      tokens[dpan] = token;
      writeJson(TOKENS, tokens);
    }
    return send(res, 200, {
      ok: cryptoOk,
      transaction: entry,
      nextCryptogram: cryptoOk ? token.cryptogram : null,
    });
  }

  return send(res, 404, { error: "Route API inconnue" });
}

function serveStatic(req, res, url) {
  let rel = url.pathname === "/" ? "/index.html" : url.pathname;
  rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC, rel);
  if (!filePath.startsWith(PUBLIC)) return send(res, 403, "Forbidden", "text/plain");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, "Not found", "text/plain");
  }
  send(res, 200, fs.readFileSync(filePath), contentType(filePath));
}

ensureData();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const client =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";
    const skipLog =
      url.pathname === "/api/health" ||
      url.pathname === "/api/runtime" ||
      (req.method === "GET" &&
        (url.pathname === "/api/journal" ||
          url.pathname === "/api/demo-cards" ||
          url.pathname === "/api/tokens"));
    if (url.pathname.startsWith("/api/") && !skipLog) {
      appendEvent({
        type: "http_api",
        method: req.method,
        path: url.pathname,
        client,
      });
    }
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url);
    }
  } catch (e) {
    appendEvent({ type: "server_error", message: e.message || "Erreur serveur" });
    send(res, 500, { error: e.message || "Erreur serveur" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const lans = lanAddresses();
  console.log("");
  if (lans.length) {
    console.log("  Serveur pret a recevoir les flux");
    console.log("  ========================================");
    console.log("  URL a ouvrir (PC + APK) :");
    for (const x of lans) {
      console.log(`      http://${x.address}:${PORT}`);
    }
    console.log("  ========================================");
  } else {
    console.log("  ############################################");
    console.log("  #  CRITICAL : PC PAS EN RESEAU             #");
    console.log("  #  Mettez cet ordinateur en reseau         #");
    console.log("  #  (Wi-Fi ou cable), puis relancez         #");
    console.log("  #  start.bat                               #");
    console.log("  ############################################");
  }
  console.log("");
});
