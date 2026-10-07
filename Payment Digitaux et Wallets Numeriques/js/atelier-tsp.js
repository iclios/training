/**
 * Simulateur pédagogique TSP — Jour 3 Atelier.
 * Aucune donnée réelle · aucun appel réseau.
 */
(function () {
  const TOKEN_BIN = "489537";
  const TABS = ["device", "vault", "txn", "log"];
  const state = {
    pan: null,
    token: null,
    status: "none", // none | active | suspended | deleted
    domain: "device",
    log: [],
    tab: "device",
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function luhnCheckDigit(body) {
    let sum = 0;
    let alt = true;
    for (let i = body.length - 1; i >= 0; i--) {
      let n = parseInt(body[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return String((10 - (sum % 10)) % 10);
  }

  function generateToken() {
    let body = TOKEN_BIN;
    while (body.length < 15) {
      body += String(Math.floor(Math.random() * 10));
    }
    return body + luhnCheckDigit(body);
  }

  function formatPanLike(num) {
    return (num || "").replace(/(.{4})/g, "$1 ").trim();
  }

  function maskPan(pan) {
    if (!pan || pan.length < 10) return "····";
    return pan.slice(0, 6) + " ···· ···· " + pan.slice(-4);
  }

  function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function pushLog(msg) {
    const t = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    state.log.unshift({ t, msg });
    if (state.log.length > 12) state.log.pop();
    renderLog();
  }

  function statusLabel(s) {
    return (
      {
        none: "—",
        active: "Actif",
        suspended: "Suspendu",
        deleted: "Supprimé",
      }[s] || s
    );
  }

  function showTab(name) {
    if (!TABS.includes(name)) return;
    state.tab = name;

    $$(".tsp-tab").forEach((btn) => {
      const on = btn.dataset.tab === name;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });

    $$(".tsp-panel").forEach((panel) => {
      const on = panel.dataset.panel === name;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
  }

  function renderChip() {
    const chip = $("#tsp-tab-chip");
    if (!chip) return;
    chip.dataset.status = state.status;
    chip.textContent =
      state.status === "none"
        ? "Token : —"
        : "Token : " + statusLabel(state.status);
  }

  function renderVault() {
    const empty = $("#tsp-vault-empty");
    const filled = $("#tsp-vault-filled");
    if (!empty || !filled) return;

    renderChip();

    if (state.status === "none" || !state.token) {
      empty.hidden = false;
      filled.hidden = true;
      return;
    }

    empty.hidden = true;
    filled.hidden = false;
    $("#tsp-out-pan").textContent = maskPan(state.pan);
    $("#tsp-out-token").textContent = formatPanLike(state.token);
    $("#tsp-out-status").textContent = statusLabel(state.status);
    $("#tsp-out-status").dataset.status = state.status;
    $("#tsp-out-domain").textContent =
      state.domain === "device" ? "device (wallet)" : state.domain;

    const badge = $("#tsp-status-badge");
    if (badge) {
      badge.textContent = statusLabel(state.status);
      badge.dataset.status = state.status;
    }
  }

  function setButtons() {
    const has = state.status === "active" || state.status === "suspended";
    const gen = $("#tsp-btn-generate");
    const sus = $("#tsp-btn-suspend");
    const res = $("#tsp-btn-resume");
    const del = $("#tsp-btn-delete");
    const pay = $("#tsp-btn-pay");

    if (gen) gen.disabled = state.status === "active" || state.status === "suspended";
    if (sus) sus.disabled = state.status !== "active";
    if (res) res.disabled = state.status !== "suspended";
    if (del) del.disabled = !has && state.status !== "deleted";
    if (del) del.disabled = state.status === "none" || state.status === "deleted";
    if (pay) pay.disabled = state.status !== "active";
  }

  function renderLog() {
    const ul = $("#tsp-log");
    if (!ul) return;
    ul.innerHTML = state.log
      .map(
        (e) =>
          `<li><span class="tsp-log-time">${e.t}</span> ${e.msg}</li>`
      )
      .join("");
  }

  function clearTxn() {
    const box = $("#tsp-txn-flow");
    if (box) box.innerHTML = "";
    const res = $("#tsp-txn-result");
    if (res) {
      res.textContent = "";
      res.className = "tsp-txn-result";
    }
  }

  function onGenerate(e) {
    e.preventDefault();
    const pan = digitsOnly($("#tsp-pan").value);
    if (pan.length < 13 || pan.length > 19) {
      pushLog("PAN invalide — saisir 13 à 19 chiffres (simulation).");
      return;
    }
    state.pan = pan;
    state.token = generateToken();
    state.status = "active";
    state.domain = "device";
    pushLog(
      `TSP : token généré ${formatPanLike(state.token)} · mapping écrit · état Actif`
    );
    clearTxn();
    renderVault();
    setButtons();
    showTab("vault");
  }

  function onSuspend() {
    if (state.status !== "active") return;
    state.status = "suspended";
    pushLog("TSP : token suspendu — Auth refusée jusqu’à reprise.");
    clearTxn();
    renderVault();
    setButtons();
  }

  function onResume() {
    if (state.status !== "suspended") return;
    state.status = "active";
    pushLog("TSP : token réactivé.");
    clearTxn();
    renderVault();
    setButtons();
  }

  function onDelete() {
    if (state.status === "none" || state.status === "deleted") return;
    state.status = "deleted";
    pushLog("TSP : token supprimé — fin de vie (carte source intacte).");
    clearTxn();
    renderVault();
    setButtons();
  }

  function onReset() {
    state.pan = null;
    state.token = null;
    state.status = "none";
    state.log = [];
    const form = $("#tsp-form");
    if (form) form.reset();
    $("#tsp-pan").value = "4532 1234 5678 7764";
    clearTxn();
    renderVault();
    renderLog();
    setButtons();
    showTab("device");
    pushLog("Simulateur réinitialisé.");
  }

  function onPay(e) {
    e.preventDefault();
    const amount = ($("#tsp-amount").value || "12.50").trim();
    const flow = $("#tsp-txn-flow");
    const result = $("#tsp-txn-result");
    if (!flow || !result) return;

    if (state.status !== "active" || !state.token) {
      result.className = "tsp-txn-result is-ko";
      result.textContent =
        state.status === "suspended"
          ? "KO — token suspendu (TSP refuse)."
          : "KO — aucun token actif.";
      flow.innerHTML = "";
      pushLog("Paiement refusé — token non utilisable.");
      return;
    }

    const tok = formatPanLike(state.token);
    const crypto = "A1B2" + String(Math.floor(Math.random() * 9000) + 1000);
    flow.innerHTML = `
      <div class="tsp-hop">
        <span class="tsp-hop-n">1</span>
        <div>
          <strong>Device / wallet</strong>
          <p>Présente <code>${tok}</code> + crypto <code>${crypto}</code></p>
        </div>
      </div>
      <div class="tsp-hop">
        <span class="tsp-hop-n">2</span>
        <div>
          <strong>Acquéreur</strong>
          <p>Voit le TOKEN (BIN ${TOKEN_BIN}…) — montant ${amount} €</p>
        </div>
      </div>
      <div class="tsp-hop">
        <span class="tsp-hop-n">3</span>
        <div>
          <strong>TSP</strong>
          <p>Détokenise → PAN ${maskPan(state.pan)} · état ${statusLabel(state.status)}</p>
        </div>
      </div>
      <div class="tsp-hop">
        <span class="tsp-hop-n">4</span>
        <div>
          <strong>Réseau → émetteur</strong>
          <p>Route avec le PAN · AuthZ OK (simulation)</p>
        </div>
      </div>
    `;
    result.className = "tsp-txn-result is-ok";
    result.textContent = `OK — ${amount} € autorisé · token transitait jusqu’au TSP`;
    pushLog(`Paiement simulé ${amount} € · token en transit · Auth OK`);
  }

  function init() {
    const root = $("#tsp-sim");
    if (!root) return;

    $("#tsp-form")?.addEventListener("submit", onGenerate);
    $("#tsp-btn-suspend")?.addEventListener("click", onSuspend);
    $("#tsp-btn-resume")?.addEventListener("click", onResume);
    $("#tsp-btn-delete")?.addEventListener("click", onDelete);
    $("#tsp-btn-reset")?.addEventListener("click", onReset);
    $("#tsp-pay-form")?.addEventListener("submit", onPay);

    root.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".tsp-tab");
      if (tabBtn?.dataset.tab) {
        showTab(tabBtn.dataset.tab);
        return;
      }
      const goto = e.target.closest("[data-goto]");
      if (goto?.dataset.goto) showTab(goto.dataset.goto);
    });

    root.addEventListener("keydown", (e) => {
      if (!e.target.classList?.contains("tsp-tab")) return;
      const i = TABS.indexOf(state.tab);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next =
          e.key === "ArrowRight"
            ? TABS[(i + 1) % TABS.length]
            : TABS[(i - 1 + TABS.length) % TABS.length];
        showTab(next);
        $(`#tsp-tab-${next}`)?.focus();
      }
    });

    if (!$("#tsp-pan").value) {
      $("#tsp-pan").value = "4532 1234 5678 7764";
    }

    showTab("device");
    renderVault();
    setButtons();
    pushLog("Simulateur TSP prêt — données fictives uniquement.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
