(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  let lastQr = null;
  let lastCardTx = null;

  function toast(msg) {
    const t = $("toast");
    t.hidden = false;
    t.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      t.hidden = true;
    }, 3200);
  }

  async function api(path, options) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  /** Quiz / « aucune réponse » : canal carte uniquement (pas wallet, pas QR). */
  function answerBlockHtml(tx) {
    if (tx.channel !== "card") return "";
    if (tx.studentAnswer) {
      return `<pre class="student-answer">studentAnswer (trace correction):\n${JSON.stringify(tx.studentAnswer, null, 2)}</pre>`;
    }
    return `<p class="no-answer">aucune réponse</p>`;
  }

  function answerLogSuffix(tx) {
    if (tx.channel !== "card" || !tx.studentAnswer) return "";
    return `\nstudentAnswer:\n${JSON.stringify(tx.studentAnswer, null, 2)}`;
  }

  function renderJournal(rows) {
    const root = $("journal");
    if (!rows.length) {
      root.innerHTML = '<p class="empty">Aucune transaction — lancez un paiement.</p>';
      return;
    }
    root.innerHTML = rows
      .map((tx) => {
        const presented = JSON.stringify(tx.presented, null, 2);
        return `<article class="tx">
          <div class="tx-head">
            <span class="badge ${tx.channel}">${tx.channel}</span>
            <span class="badge ${tx.auth}">${tx.auth}</span>
            <strong>${Number(tx.amount).toFixed(2)} ${tx.currency}</strong>
            <span>${new Date(tx.at).toLocaleString("fr-FR")}</span>
            <code>${tx.id}</code>
          </div>
          <div>${tx.note || ""}</div>
          <pre>${presented}</pre>
          <pre>stages: ${JSON.stringify(tx.stages)}</pre>
          ${
            tx.path
              ? `<pre>path:\n${tx.path.map((s, i) => `${i + 1}. ${s}`).join("\n")}</pre>`
              : ""
          }
          ${answerBlockHtml(tx)}
        </article>`;
      })
      .join("");
  }

  async function loadJournal() {
    const data = await api("/api/journal");
    renderJournal(data.journal || []);
  }

  async function loadCards() {
    const data = await api("/api/demo-cards");
    const opts = (data.cards || [])
      .map((c) => `<option value="${c.pan}">${c.masked} · ${c.brand}</option>`)
      .join("");
    $("card-pan").innerHTML = opts;
    $("token-pan").innerHTML = (data.cards || [])
      .filter((c) => c.expected === "approve")
      .map(
        (c) =>
          `<option value="${c.pan}">${c.masked} · ${c.brand}</option>`
      )
      .join("");
    $("card-hint").textContent = "";
  }

  async function loadTokens() {
    /* tokens listés via credentials après provision */
  }

  let lastWalletCredPayload = null;

  function renderWalletCredQr(payload) {
    lastWalletCredPayload = payload;
    const holder = $("wallet-cred-qr");
    holder.innerHTML = "";
    // eslint-disable-next-line no-undef
    new QRCode(holder, {
      text: payload,
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function showWalletCreds(token, credPayload) {
    $("wallet-creds").hidden = false;
    $("wallet-cred-paste").value = "";
    $("wallet-dpan-input").value = "";
    $("wallet-crypt-input").value = "";
    $("wallet-scan-status").hidden = true;
    renderWalletCredQr(credPayload || `PDWNWALLET|v1|dpan=${token.dpan}|crypt=${token.cryptogram}`);
  }

  function parseWalletCredLocal(raw) {
    const m = String(raw || "")
      .trim()
      .match(/^PDWNWALLET\|v1\|dpan=([^|]+)\|crypt=([A-Fa-f0-9]+)$/i);
    if (!m) return null;
    return { dpan: m[1].trim(), cryptogram: m[2].trim().toUpperCase() };
  }

  $("btn-qr-create").addEventListener("click", async () => {
    try {
      const amount = Number($("qr-amount").value);
      lastQr = await api("/api/qr/create", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      $("qr-box").hidden = false;
      const holder = $("qr-img");
      holder.innerHTML = "";
      // lib vendor/qrcode.min.js (qrcodejs)
      // eslint-disable-next-line no-undef
      new QRCode(holder, {
        text: lastQr.payload,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.M,
      });
      $("qr-paste").value = "";
      const d = lastQr.decoded || {};
      $("qr-decoded").textContent = [
        `Mode: MPM · POI (01)=${d.poiMethod || "?"} ${d.dynamic ? "dynamique" : ""}`,
        `Montant (54): ${d.amount} · Devise (53): ${d.currency}`,
        `Marchand (59): ${d.merchantName || "—"} · ${d.city || ""}`,
        `(GUID / bill / CRC / payload brut : via scan)`,
      ].join("\n");
      toast("QR EMV MPM généré — scannez-le");
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-qr-pay").addEventListener("click", async () => {
    try {
      const cleaned = String($("qr-paste").value || "").trim();
      if (!cleaned) throw new Error("Collez d’abord le payload scanné");
      await api("/api/pay/qr", {
        method: "POST",
        body: JSON.stringify({ payload: cleaned }),
      });
      toast("Paiement MPM (payload collé)");
      await loadJournal();
    } catch (e) {
      toast(e.message);
    }
  });

  function openCardModal() {
    $("card-modal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCardModal() {
    $("card-modal").hidden = true;
    document.body.style.overflow = "";
  }

  function showCardLog(tx, { resetForm = true, open = true } = {}) {
    lastCardTx = tx;
    $("btn-card-open-quiz").hidden = false;
    if (resetForm) {
      $("card-quiz-feedback").hidden = true;
      $("q-auth").value = "";
      $("q-clearing").value = "";
      $("q-settlement").value = "";
      $("q-path").value = "";
    }
    const cardMain = [
      `id: ${tx.id}`,
      `channel: ${tx.channel}`,
      `auth: ${tx.auth}`,
      `amount: ${tx.amount} ${tx.currency}`,
      `presented: ${JSON.stringify(tx.presented, null, 2)}`,
      `stages: ${JSON.stringify(tx.stages, null, 2)}`,
      `path:`,
      ...(tx.path || []).map((s, i) => `  ${i + 1}. ${s}`),
      `note: ${tx.note || ""}`,
    ].join("\n");
    $("card-log").innerHTML =
      cardMain.replace(/</g, "&lt;") +
      answerLogSuffix(tx).replace(/</g, "&lt;") +
      (tx.studentAnswer ? "" : '<span class="no-answer">aucune réponse</span>');
    if (open) openCardModal();
  }

  $("btn-card-open-quiz").addEventListener("click", () => {
    if (!lastCardTx) {
      toast("Lancez d’abord une AuthZ carte");
      return;
    }
    openCardModal();
  });
  $("btn-card-modal-close").addEventListener("click", closeCardModal);
  $("card-modal-backdrop").addEventListener("click", closeCardModal);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("card-modal").hidden) closeCardModal();
  });

  $("btn-card-pay").addEventListener("click", async () => {
    try {
      const res = await api("/api/pay/card", {
        method: "POST",
        body: JSON.stringify({
          pan: $("card-pan").value,
          amount: Number($("card-amount").value),
        }),
      });
      toast(res.ok ? "Carte approve — lisez le log" : "Carte decline — lisez le log");
      showCardLog(res.transaction);
      await loadJournal();
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-card-quiz").addEventListener("click", async () => {
    try {
      if (!lastCardTx) throw new Error("Lancez d’abord une AuthZ carte");
      const auth = $("q-auth").value;
      const clearing = $("q-clearing").value;
      const settlement = $("q-settlement").value;
      const path = $("q-path").value;
      if (!auth || !clearing || !settlement || !path) {
        throw new Error("Renseignez toutes les réponses avant d’enregistrer");
      }
      const res = await api("/api/journal/answer", {
        method: "POST",
        body: JSON.stringify({
          txId: lastCardTx.id,
          auth,
          clearing,
          settlement,
          path,
        }),
      });
      lastCardTx = res.transaction;
      showCardLog(lastCardTx, { resetForm: false });
      const fb = $("card-quiz-feedback");
      fb.hidden = false;
      fb.className = "quiz-feedback ok";
      fb.textContent =
        "Réponse enregistrée dans le journal (studentAnswer) — trace pour correction.";
      toast("Réponse enregistrée dans le log");
      await loadJournal();
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-provision").addEventListener("click", async () => {
    try {
      const res = await api("/api/token/provision", {
        method: "POST",
        body: JSON.stringify({
          pan: $("token-pan").value,
          walletId: $("wallet-id").value,
        }),
      });
      showWalletCreds(res.token, res.credPayload);
      toast("QR credentials prêt — scannez (DPAN/crypto masqués)");
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-wallet-apply-scan").addEventListener("click", async () => {
    try {
      const raw = String($("wallet-cred-paste").value || "").trim();
      if (!raw) throw new Error("Collez d’abord le payload scanné");
      let parsed = parseWalletCredLocal(raw);
      if (!parsed) {
        const res = await api("/api/wallet/parse-cred", {
          method: "POST",
          body: JSON.stringify({ payload: raw }),
        });
        parsed = { dpan: res.dpan, cryptogram: res.cryptogram };
      }
      $("wallet-dpan-input").value = parsed.dpan;
      $("wallet-crypt-input").value = parsed.cryptogram;
      const st = $("wallet-scan-status");
      st.hidden = false;
      st.textContent =
        "Scan appliqué — DPAN/crypto prêts pour payer (valeurs non affichées).";
      toast("Credentials wallet appliqués");
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-wallet-pay").addEventListener("click", async () => {
    try {
      let dpan = String($("wallet-dpan-input").value || "").trim();
      let cryptogram = String($("wallet-crypt-input").value || "").trim();
      if (!dpan || !cryptogram) {
        const pasted = String($("wallet-cred-paste").value || "").trim();
        const parsed = parseWalletCredLocal(pasted);
        if (parsed) {
          dpan = parsed.dpan;
          cryptogram = parsed.cryptogram;
          $("wallet-dpan-input").value = dpan;
          $("wallet-crypt-input").value = cryptogram;
        }
      }
      if (!dpan || !cryptogram) {
        throw new Error("Scannez le QR credentials et collez le payload d’abord");
      }
      const res = await api("/api/pay/wallet", {
        method: "POST",
        body: JSON.stringify({
          dpan,
          cryptogram,
          amount: Number($("wallet-amount").value),
          source: "browser",
        }),
      });
      if (res.ok && res.nextCryptogram) {
        const newPayload = `PDWNWALLET|v1|dpan=${dpan}|crypt=${res.nextCryptogram}`;
        renderWalletCredQr(newPayload);
        $("wallet-cred-paste").value = "";
        $("wallet-dpan-input").value = "";
        $("wallet-crypt-input").value = "";
        $("wallet-scan-status").hidden = true;
      }
      toast(
        res.ok
          ? "Paiement wallet OK — voir le journal"
          : "Paiement decline (crypto) — voir le journal"
      );
      await loadJournal();
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-refresh").addEventListener("click", () =>
    loadJournal().then(() => toast("Journal à jour"))
  );

  $("btn-export").addEventListener("click", async () => {
    try {
      const student = window.prompt(
        "Nom / binôme pour le fichier de logs (notation) :",
        ""
      );
      if (student === null) return;
      const q = student.trim()
        ? `?student=${encodeURIComponent(student.trim())}`
        : "";
      const pack = await api("/api/export" + q);
      const slug = (student || "etudiant")
        .trim()
        .replace(/[^\w\-]+/g, "_")
        .slice(0, 40);
      const stamp = (pack.exportedAt || new Date().toISOString()).replace(
        /[:.]/g,
        "-"
      );
      const blob = new Blob([JSON.stringify(pack, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pdwn-logs-${slug}-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      const shortHash = (pack.contentHash || "").slice(0, 12);
      toast(
        shortHash
          ? `Logs exportés · ${pack.exportedAtLocal || ""} · hash ${shortHash}…`
          : "Logs exportés — à envoyer au formateur"
      );
    } catch (e) {
      toast(e.message);
    }
  });

  $("btn-reset").addEventListener("click", async () => {
    if (!confirm("Vider le journal des transactions ? (les events de notation sont conservés)"))
      return;
    await api("/api/journal/reset", { method: "POST", body: "{}" });
    toast("Journal vidé");
    await loadJournal();
  });

  function renderKitConfigQr(url) {
    const wrap = $("lan-config-qr-wrap");
    const holder = $("lan-config-qr");
    const label = $("lan-config-url");
    if (!wrap || !holder || !url) {
      if (wrap) wrap.hidden = true;
      return;
    }
    holder.innerHTML = "";
    // eslint-disable-next-line no-undef
    new QRCode(holder, {
      text: `PDWNKIT|v1|${url}`,
      width: 160,
      height: 160,
      correctLevel: QRCode.CorrectLevel.M,
    });
    label.textContent = url;
    wrap.hidden = false;
  }

  async function showLanBanner() {
    try {
      const rt = await api("/api/runtime");
      const host = window.location.hostname;
      const isLocal =
        host === "localhost" || host === "127.0.0.1" || host === "[::1]";
      const el = $("lan-banner");
      const textEl = $("lan-banner-text");
      const phoneUrls = rt.phoneUrls || [];
      if (!isLocal && !phoneUrls.length) {
        el.hidden = true;
        return;
      }
      const urls = phoneUrls.map((u) => `<code>${u}</code>`).join(" · ");
      el.hidden = false;
      if (!phoneUrls.length) {
        textEl.innerHTML =
          `<strong>CRITICAL : PC pas en réseau</strong> — mettez cet ordinateur en réseau (Wi‑Fi ou câble), puis relancez <code>start.bat</code>.`;
        renderKitConfigQr(null);
      } else {
        textEl.innerHTML = `<strong>Serveur prêt</strong> · ${urls}`;
        renderKitConfigQr(phoneUrls[0] || (!isLocal ? window.location.origin : null));
      }
    } catch (_) {
      /* ignore */
    }
  }

  Promise.all([loadCards(), loadTokens(), loadJournal(), showLanBanner()]).catch(
    (e) => toast(e.message)
  );
})();
