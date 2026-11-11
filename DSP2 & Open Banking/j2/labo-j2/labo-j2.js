/* ============================================================
   Labo J2 — AIS (lecture) & CBPII (vérification de fonds)
   100 % côté client. Aucune requête réseau.
   ============================================================ */

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function randHex(len) {
    var s = "";
    for (var i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    return s;
  }
  function eur(n) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  }

  /* ---------- Journal d'étapes ---------- */
  function makeLogger(container) {
    if (container.dataset.started !== "1") {
      container.innerHTML = "";
      container.dataset.started = "1";
    }
    var t0 = Date.now();
    return function log(message, kind) {
      var line = document.createElement("div");
      line.className = "line" + (kind ? " " + kind : "");
      var t = document.createElement("span");
      t.className = "t";
      t.textContent = "+" + ((Date.now() - t0) / 1000).toFixed(1) + "s";
      var m = document.createElement("span");
      m.className = "msg";
      m.textContent = message;
      line.append(t, m);
      container.appendChild(line);
      container.scrollTop = container.scrollHeight;
    };
  }

  /* ---------- État partagé entre les onglets ---------- */
  var state = {
    consented: false,
    revoked: false,
    consentId: null,
    token: null,
    scopes: [],
    days: 90
  };

  /* ---------- Données fictives (solde + transactions) ---------- */
  var ACCOUNTS = {
    "Compte courant": {
      iban: "FR76 3000 4000 0312 3456 7890 143",
      balance: 1842.60,
      transactions: [
        { date: "2025-11-08", label: "SNCF · Billet Paris–Lyon", amount: -42.90 },
        { date: "2025-11-07", label: "ACME SARL · Salaire novembre", amount: 2500.00 },
        { date: "2025-11-05", label: "Carrefour Market", amount: -63.18 },
        { date: "2025-11-03", label: "Netflix", amount: -13.49 },
        { date: "2025-11-01", label: "Virement loyer", amount: -780.00 }
      ]
    },
    "Livret A": {
      iban: "FR76 3000 4000 0312 3456 7890 257",
      balance: 5000.00,
      transactions: [
        { date: "2025-10-31", label: "Intérêts trimestriels", amount: 12.40 },
        { date: "2025-10-15", label: "Virement depuis compte courant", amount: 500.00 }
      ]
    },
    "Compte-titres": {
      iban: "FR76 3000 4000 0312 3456 7890 361",
      balance: 12430.00,
      transactions: [
        { date: "2025-11-04", label: "Achat action ETF Monde", amount: -1500.00 },
        { date: "2025-10-20", label: "Dividende", amount: 87.50 }
      ]
    }
  };

  /* ============================================================
     ONGLETS
     ============================================================ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));

  function selectTab(tab) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute("aria-selected", sel ? "true" : "false");
      t.tabIndex = sel ? 0 : -1;
    });
    panels.forEach(function (p) {
      p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* ============================================================
     ONGLET 1 — CONSENTEMENT AIS
     ============================================================ */
  (function stepConsent() {
    var btnConsent = $("btn-consent");
    var form = $("consent-form");
    var granted = $("granted-1");
    var journal = makeLogger($("journal-consent"));

    function refreshTokenDisplay() {
      var txt = state.token ? state.token : "—";
      $("hdr-token").textContent = txt;
      $("hdr-token-2").textContent = txt;
    }

    btnConsent.addEventListener("click", async function () {
      var checked = Array.prototype.slice.call(document.querySelectorAll(".acc-check:checked"))
        .map(function (c) { return c.value; });

      if (!checked.length) {
        journal("Aucun compte coché — aucun consentement possible.", "danger");
        return;
      }

      state.days = parseInt($("consent-days").value, 10);
      state.consented = true;
      state.revoked = false;
      state.scopes = checked.slice();
      state.consentId = "cns_" + randHex(12);
      state.token = "at_" + randHex(24);

      journal("Lyam est redirigé vers Banque Est (SCA).", "ok");
      await wait(350);
      journal("Comptes autorisés : " + checked.join(", "), "ok");
      journal("Durée : " + state.days + " jours.", "ok");
      await wait(300);
      journal("Banque Est émet un consentId et un access_token.", "ok");
      journal("→ consentId : " + state.consentId, "ok");
      journal("→ access_token : " + state.token + "  (porteur à durée limitée)", "ok");
      journal("Le mot de passe de Lyam n'a jamais quitté la banque.", "warn");

      form.hidden = true;
      granted.hidden = false;
      $("out-consent-id").textContent = state.consentId;
      $("out-token").textContent = state.token;
      $("out-scopes").textContent = checked.join(", ");
      $("out-expire").textContent = "J+" + state.days;

      refreshTokenDisplay();
    });

    $("btn-revoke-1").addEventListener("click", function () {
      if (!state.consented) return;
      state.revoked = true;
      state.consented = false;
      journal("Consentement révoqué — le jeton est invalidé immédiatement.", "danger");
      granted.hidden = true;
      form.hidden = false;
      refreshTokenDisplay();
    });
  })();

  /* ============================================================
     ONGLET 2 — LECTURE AIS
     ============================================================ */
  (function stepAis() {
    var btnCall = $("btn-call");
    var btnTx = $("btn-tx");
    var json = $("json-resp");
    var pick = $("acc-pick");
    var txList = $("tx-list");
    var txFilter = $("tx-filter");
    var journal = makeLogger($("journal-ais"));

    var selectedAccount = null;
    var received = [];

    function renderAccounts() {
      pick.innerHTML = "";
      if (!received.length) {
        pick.innerHTML =
          '<span class="empty" style="color:var(--faint);font-style:italic;">' +
          "Aucun compte. Cliquez d’abord sur « Appeler /accounts ».</span>";
        return;
      }
      received.forEach(function (acc) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = acc.type;
        b.addEventListener("click", function () {
          Array.prototype.slice.call(pick.children).forEach(function (x) {
            x.classList && x.classList.remove("is-active");
          });
          b.classList.add("is-active");
          selectedAccount = acc.type;
          txFilter.hidden = false;
          loadTx();
        });
        pick.appendChild(b);
      });
      if (received.length) {
        pick.children[0].click();
      }
    }

    function loadTx() {
      if (!selectedAccount) return;
      var acc = ACCOUNTS[selectedAccount];
      var from = $("tx-from").value;
      var rows = acc.transactions.filter(function (t) {
        return !from || t.date >= from;
      });

      journal("GET /v1/accounts/…/transactions (" + selectedAccount + ")", "warn");
      if (from) journal("Filtre : depuis le " + from, "warn");

      txList.innerHTML = "";
      if (!rows.length) {
        txList.innerHTML =
          '<div class="empty" style="padding:0.8rem;color:var(--faint);font-style:italic;">' +
          "Aucune transaction sur cette période.</div>";
        return;
      }
      rows.forEach(function (t) {
        var row = document.createElement("div");
        row.className = "tx-row";
        var credit = t.amount >= 0;
        row.innerHTML =
          '<div class="tx-main">' +
            '<div class="tx-label">' + t.label + "</div>" +
            '<div class="tx-date">' + t.date + "</div>" +
          "</div>" +
          '<div class="tx-amt ' + (credit ? "credit" : "debit") + '">' +
            (credit ? "+" : "") + eur(t.amount) +
          "</div>";
        txList.appendChild(row);
      });
      journal("200 OK — " + rows.length + " transaction(s) lues.", "ok");
    }

    btnCall.addEventListener("click", async function () {
      if (!state.consented || state.revoked || !state.token) {
        json.innerHTML = "<code>// 401 Unauthorized — aucun consentement actif.</code>";
        journal("Échec : pas de jeton valide.", "danger");
        return;
      }

      btnCall.disabled = true;
      journal("MonBudget appelle GET /v1/accounts.", "warn");
      await wait(300);
      journal("Authorization: Bearer " + state.token.slice(0, 10) + "…", "warn");
      await wait(400);

      received = state.scopes.map(function (name, i) {
        var a = ACCOUNTS[name];
        return {
          accountId: "acc_" + (1000 + i),
          type: name,
          iban: a.iban,
          currency: "EUR",
          balance: a.balance
        };
      });

      var payload = { data: received, _links: { self: "/v1/accounts" } };
      json.textContent = JSON.stringify(payload, null, 2);

      journal("200 OK — réponse JSON reçue.", "ok");
      await wait(200);
      journal(received.length + " compte(s) autorisés, sans parsing de balises.", "ok");

      renderAccounts();
      btnCall.disabled = false;
    });

    btnTx.addEventListener("click", function () {
      if (!selectedAccount) {
        journal("Sélectionnez d’abord un compte.", "warn");
        return;
      }
      loadTx();
    });

    // défaut "depuis le 1er du mois courant"
    var now = new Date();
    var y = now.getFullYear();
    var m = ("0" + (now.getMonth() + 1)).slice(-2);
    $("tx-from").value = y + "-" + m + "-01";
  })();

  /* ============================================================
     ONGLET 3 — VÉRIFICATION CBPII
     ============================================================ */
  (function stepCbpii() {
    var btn = $("btn-funds");
    var json = $("json-cbpii");
    var badge = $("bool-result");
    var journal = makeLogger($("journal-cbpii"));

    btn.addEventListener("click", async function () {
      if (!state.consented || state.revoked || !state.token) {
        json.innerHTML = "<code>// 401 Unauthorized — consentement CBPII absent.</code>";
        journal("Échec : pas de consentement actif.", "danger");
        return;
      }

      var amount = parseFloat($("amount").value);
      if (isNaN(amount) || amount <= 0) {
        journal("Montant invalide — saisissez un montant positif.", "danger");
        return;
      }

      btn.disabled = true;
      journal("POST /v1/funds-confirmations — montant " + eur(amount), "warn");
      await wait(350);

      var balance = ACCOUNTS["Compte courant"].balance;
      var fundsAvailable = balance >= amount;

      var payload = {
        fundsAvailable: fundsAvailable,
        account: { iban: ACCOUNTS["Compte courant"].iban }
      };
      json.textContent = JSON.stringify(payload, null, 2);

      journal("200 OK — réponse booléenne reçue.", "ok");
      journal(
        "fundsAvailable = " + fundsAvailable + " (aucun solde transmis)",
        fundsAvailable ? "ok" : "danger"
      );

      badge.className = "bool-badge " + (fundsAvailable ? "yes" : "no");
      badge.innerHTML =
        '<span class="bool-mark">' + (fundsAvailable ? "✓" : "✕") + "</span>" +
        '<span class="bool-text">' +
        (fundsAvailable
          ? "Fonds suffisants — paiement autorisable"
          : "Fonds insuffisants — paiement à refuser") +
        "</span>";

      btn.disabled = false;
    });
  })();

})();
