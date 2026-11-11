/* ============================================================
   Labo API & consentement — logique interactive
   100 % côté client. Aucune requête réseau.
   ============================================================ */

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

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

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
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

  /* Données de comptes (fictives) — équivalent API du relevé HTML. */
  var ACCOUNTS = {
    "Compte courant": { iban: "FR76 3000 4000 0312 3456 7890 143", balance: "1 842,60 EUR" },
    "Livret A":       { iban: "FR76 3000 4000 0312 3456 7890 257", balance: "5 000,00 EUR" },
    "Compte-titres":  { iban: "FR76 3000 4000 0312 3456 7890 361", balance: "12 430,00 EUR" }
  };

  function randHex(len) {
    var s = "";
    for (var i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    return s;
  }

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
     ÉTAPE 1 — CONSENTEMENT
     ============================================================ */
  (function stepConsent() {
    var btnConsent = $("btn-consent");
    var form = $("consent-form");
    var granted = $("granted-1");
    var journal = makeLogger($("journal-consent"));

    function refreshTokenDisplay() {
      $("hdr-token").textContent = state.token ? state.token : "—";
      $("revoke-consent-id").textContent = state.consentId ? state.consentId : "—";
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
      revokeConsent(journal);
      granted.hidden = true;
      form.hidden = false;
      refreshTokenDisplay();
    });
  })();

  /* Fonction de révocation partagée (onglet 1 et onglet 3) */
  function revokeConsent(journal) {
    if (!state.consented) return;
    state.revoked = true;
    state.consented = false; /* le jeton ne vaut plus rien */
    journal("Consentement révoqué — le jeton est invalidé immédiatement.", "danger");
    journal("Toute nouvelle requête de MonBuddy sera refusée (401).", "danger");
    updateRevokeUI("revoked");
  }

  function updateRevokeUI(mode) {
    var status = $("revoke-status");
    var consentId = $("revoke-consent-id");
    if (!status) return;
    consentId.textContent = state.consentId || "—";
    if (mode === "revoked" || state.revoked) {
      status.textContent = "révoqué";
      status.className = "v revoked";
    } else if (state.consented) {
      status.textContent = "actif";
      status.className = "v";
    } else {
      status.textContent = "aucun";
      status.className = "v pending";
    }
  }

  /* ============================================================
     ÉTAPE 2 — APPEL API
     ============================================================ */
  (function stepCall() {
    var btnCall = $("btn-call");
    var json = $("json-resp");
    var accounts = $("accounts-2");
    var journal = makeLogger($("journal-call"));

    btnCall.addEventListener("click", async function () {
      if (!state.consented || state.revoked || !state.token) {
        json.innerHTML = "<code>// 401 Unauthorized — aucun consentement actif.</code>";
        accounts.innerHTML = '<div class="empty">Appel refusé : accordez d’abord un consentement (onglet 1).</div>';
        journal("Échec : pas de jeton valide.", "danger");
        return;
      }

      btnCall.disabled = true;
      journal("MonBuddy appelle GET /accounts.", "warn");
      await wait(300);
      journal("Authorization: Bearer " + state.token.slice(0, 10) + "…", "warn");
      await wait(400);

      /* Réponse JSON (mime une API réelle) */
      var data = state.scopes.map(function (name, i) {
        var a = ACCOUNTS[name];
        return {
          accountId: "acc_" + (1000 + i),
          type: name,
          iban: a.iban,
          currency: "EUR",
          balance: a.balance
        };
      });

      var payload = {
        data: data,
        _links: { self: "/v1/accounts" }
      };

      json.textContent = JSON.stringify(payload, null, 2);

      journal("200 OK — réponse JSON reçue.", "ok");
      await wait(200);
      journal(data.length + " compte(s) structurés, sans parsing de balises.", "ok");

      /* Affichage côté MonBuddy */
      accounts.innerHTML = "";
      data.forEach(function (acc) {
        var div = document.createElement("div");
        div.className = "acc-item";
        div.innerHTML =
          '<div class="acc-name"><span class="acc-name">' + acc.type + "</span></div>" +
          '<div class="acc-iban">' + acc.iban + "</div>" +
          '<div class="acc-bal">' + acc.balance + "</div>";
        accounts.appendChild(div);
      });

      journal("Une refonte du site web ne casserait rien ici : contrat versionné /v1.", "warn");
      btnCall.disabled = false;
    });
  })();

  /* ============================================================
     ÉTAPE 3 — RÉVOCATION
     ============================================================ */
  (function stepRevoke() {
    var btnRevoke = $("btn-revoke");
    var btnRetry = $("btn-retry");
    var result = $("retry-result");
    var journal = makeLogger($("journal-revoke"));

    // init affichage statut
    updateRevokeUI(state.revoked ? "revoked" : "init");

    btnRevoke.addEventListener("click", function () {
      if (!state.consented && !state.revoked) {
        journal("Aucun consentement à révoquer — accordez-en un (onglet 1).", "danger");
        return;
      }
      if (state.revoked) {
        journal("Déjà révoqué.", "warn");
        return;
      }
      revokeConsent(journal);
      btnRevoke.disabled = true;
    });

    btnRetry.addEventListener("click", async function () {
      if (!state.revoked) {
        result.className = "result-box";
        result.innerHTML = '<div class="empty">Révoquez d’abord le consentement, puis réessayez.</div>';
        journal("Le consentement est encore actif — l’appel réussirait.", "warn");
        return;
      }
      journal("MonBuddy réessaie GET /accounts avec l’ancien jeton.", "warn");
      await wait(500);
      result.className = "result-box err";
      result.innerHTML =
        '<div><span class="code">HTTP 401 Unauthorized</span></div>' +
        "<div>Le jeton a été révoqué. MonBuddy n’a plus aucun accès.</div>";
      journal("401 Unauthorized — accès refusé (jeton révoqué).", "danger");
      journal("Lyam n’a pas eu à changer son mot de passe.", "ok");
    });
  })();

})();
