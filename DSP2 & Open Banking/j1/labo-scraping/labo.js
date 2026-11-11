/* ============================================================
   Labo — logique interactive
   100 % côté client. Aucune requête réseau.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Identifiants fictifs de Lyam ---------- */
  var CREDENTIALS = { login: "lyam.demo", password: "soleilmars" };

  /* Accès DOM court */
  function $(id) { return document.getElementById(id); }

  /* ---------- Journal d'étapes ---------- */
  function makeLogger(container) {
    // vide le "en attente"
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
      var elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      t.textContent = "+" + elapsed + "s";
      var m = document.createElement("span");
      m.className = "msg";
      m.textContent = message;
      line.append(t, m);
      container.appendChild(line);
      container.scrollTop = container.scrollHeight;
    };
  }

  /* petit délai utilitaire */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ============================================================
     ONGLETS
     ============================================================ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));

  function selectTab(tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
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
     SCÉNARIO 1 — CONNEXION CLASSIQUE
     ============================================================ */
  (function scenarioLogin() {
    var btnLogin = $("btn-login-1");
    var btnLogout = $("btn-logout-1");
    var loginCard = $("bank-login-1");
    var dash = $("dash-1");
    var journal = makeLogger($("journal-1"));

    btnLogin.addEventListener("click", function () {
      var id = $("login-id-1").value.trim();
      var pwd = $("login-pwd-1").value;

      journal("Lyam se connecte sur le site de Banque Est.", "ok");
      if (!id || !pwd) {
        journal("Champs vides — connexion refusée.", "danger");
        return;
      }
      if (id !== CREDENTIALS.login || pwd !== CREDENTIALS.password) {
        journal("Identifiants incorrects.", "danger");
        return;
      }
      journal("Authentification réussie (côté banque).", "ok");
      journal("Session ouverte au nom de Lyam — la banque sait que c'est lui.", "ok");

      btnLogin.disabled = true;
      loginCard.style.display = "none";
      dash.classList.add("show");
    });

    btnLogout.addEventListener("click", function () {
      dash.classList.remove("show");
      loginCard.style.display = "";
      btnLogin.disabled = false;
      journal("Lyam se déconnecte. Session fermée, rien n'a été stocké.", "ok");
    });
  })();

  /* ============================================================
     SCÉNARIO 2 — SCREEN SCRAPING
     ============================================================ */
  (function scenarioScraping() {
    var btnScrape = $("btn-scrape");
    var btnReset = $("btn-reset-2");
    var btnRefonte = $("btn-refonte");
    var refonteBanner = $("refonte-banner");
    var btnLogin2 = $("btn-login-2");
    var loginCard = $("bank-login-2");
    var dash = $("dash-2");
    var inputId = $("login-id-2");
    var inputPwd = $("login-pwd-2");
    var hint = $("hint-2");
    var extracted = $("extracted-2");
    var leak = $("leak-2");
    var journal = makeLogger($("journal-2"));

    /* Sauvegarde du tbody d'origine, pour pouvoir restaurer. */
    var releve2 = $("releve-2");
    var tbodyOriginal = releve2.querySelector("tbody").innerHTML;
    var refonteActive = false;

    function fillField(input, value) {
      return (async function () {
        input.value = "";
        input.classList.remove("is-filled");
        for (var i = 0; i < value.length; i++) {
          input.value += value[i];
          await wait(35);
        }
        input.classList.add("is-filled");
      })();
    }

    function readTable() {
      // Lit RÉELLEMENT le DOM : c'est le cœur du screen scraping.
      var rows = document.querySelectorAll("#releve-2 tbody tr");
      var data = [];
      rows.forEach(function (tr) {
        var date = tr.querySelector("td.date");
        var libelle = tr.querySelector("td.libelle");
        var montant = tr.querySelector("td.montant");
        if (date && libelle && montant) {
          data.push({
            date: date.textContent.trim(),
            libelle: libelle.textContent.trim(),
            montant: montant.textContent.trim(),
            type: montant.classList.contains("credit") ? "credit" : "debit"
          });
        }
      });
      return data;
    }

    btnScrape.addEventListener("click", async function () {
      btnScrape.disabled = true;
      btnReset.disabled = true;
      journal = makeLogger($("journal-2"));

      journal("MonBuddy démarre sa « synchro ».", "warn");
      journal("Aucune API disponible : elle attaque la page web de la banque.", "warn");
      await wait(400);

      journal("1) Rejoue les identifiants de Lyam dans le formulaire…", "warn");
      await fillField(inputId, CREDENTIALS.login);
      journal("   → identifiant saisi : " + CREDENTIALS.login, "warn");
      await wait(250);
      await fillField(inputPwd, CREDENTIALS.password);
      journal("   → mot de passe saisi : " + CREDENTIALS.password + "  (en clair !)", "danger");
      await wait(300);

      // le panneau fuite apparaît AVANT la validation
      leak.hidden = false;
      hint.textContent = "Formulaire rempli automatiquement…";
      journal("2) Les identifiants sont conservés par MonBuddy (pour la prochaine fois).", "danger");
      await wait(400);

      btnLogin2.disabled = false;
      journal("3) Clique sur « Se connecter » — la banque ne voit aucune différence.", "warn");
      await wait(500);

      // la banque "répond"
      loginCard.style.display = "none";
      dash.classList.add("show");
      journal("4) Session ouverte « au nom de Lyam » sans que Lyam n'ait rien fait.", "danger");
      await wait(400);

      journal("5) Lecture du tableau HTML (lecture des <td> du DOM)…", "warn");
      await wait(500);

      var data = readTable();
      renderExtracted(data);

      if (refonteActive) {
        /* Le HTML a changé : le robot cherche td.date/td.libelle/td.montant
           et ne trouve plus rien. */
        journal("   → 0 opération extraite.", "danger");
        journal("   ✕ Les sélecteurs td.montant / td.date / td.libelle"
          + " n'existent plus dans la page refondue.", "danger");
        journal("Donnée absente : le budget de Lyam devient vide sans alerte.",
          "danger");
        journal("Ou pire : un sélecteur mal placé lirait une donnée fausse "
          + "(une date dans un libellé, un débit compté en crédit).", "danger");
        journal("La banque a changé son HTML → le robot est cassé. "
          + "Il faudrait tout réécrire, banque par banque.", "danger");
      } else {
        journal("   → " + data.length + " opérations extraites du DOM.", "ok");
        data.forEach(function (op) {
          journal("    • " + op.date + "  " + op.libelle + "  " + op.montant);
        });
        journal("Synchro terminée. Données affichées dans MonBuddy.", "ok");
        journal("Fragilité : essayez « Simuler une refonte » puis relancez "
          + "la synchro…", "warn");
        /* On autorise la refonte seulement après une synchro réussie. */
        btnRefonte.disabled = false;
      }

      btnScrape.disabled = false;
      btnReset.disabled = false;
    });

    function renderExtracted(data) {
      if (!data.length) {
        extracted.innerHTML = '<div class="empty">Aucune opération extraite (DOM vide ?).</div>';
        return;
      }
      var html = "<h4>Données extraites du DOM</h4><ul>";
      data.forEach(function (op) {
        var sym = op.type === "credit" ? "▲" : "▼";
        html += "<li>" + op.date + " — " + op.libelle +
                " — <strong>" + op.montant + "</strong> " + sym + "</li>";
      });
      html += "</ul>";
      extracted.innerHTML = html;
    }

    /* Simule une refonte : les classes que le robot cherche
       (td.date / td.libelle / td.montant) disparaissent au profit de
       nouvelles (tr.tx-row > td.tx-when / td.tx-what / td.tx-amount).
       La structure reste un tableau valide, mais readTable() ne
       retrouve plus ses sélecteurs → 0 donnée. */
    function applyRefonte() {
      var tbody = releve2.querySelector("tbody");
      var rows = tbody.querySelectorAll("tr");
      var frag = document.createDocumentFragment();

      rows.forEach(function (tr) {
        var date = tr.querySelector("td.date");
        var libelle = tr.querySelector("td.libelle");
        var montant = tr.querySelector("td.montant");
        if (!date || !libelle || !montant) return;

        var newTr = document.createElement("tr");
        newTr.className = "tx-row";

        var tdWhen = document.createElement("td");
        tdWhen.className = "tx-when";
        tdWhen.textContent = date.textContent.trim();

        var tdWhat = document.createElement("td");
        tdWhat.className = "tx-what";
        tdWhat.textContent = libelle.textContent.trim();

        var tdAmount = document.createElement("td");
        var isCredit = montant.classList.contains("credit");
        tdAmount.className = "tx-amount " + (isCredit ? "pos" : "neg");
        tdAmount.textContent = montant.textContent.trim();

        newTr.append(tdWhen, tdWhat, tdAmount);
        frag.appendChild(newTr);
      });

      tbody.innerHTML = "";
      tbody.appendChild(frag);
      releve2.classList.add("is-refonte");
      refonteActive = true;
      refonteBanner.hidden = false;
      btnRefonte.disabled = true;
    }

    function restoreOriginal() {
      releve2.querySelector("tbody").innerHTML = tbodyOriginal;
      releve2.classList.remove("is-refonte");
      refonteActive = false;
      refonteBanner.hidden = true;
      btnRefonte.disabled = true;
    }

    btnRefonte.addEventListener("click", function () {
      if (refonteActive) return;
      applyRefonte();
      journal("Banque Est a refait son site : le HTML a changé "
        + "(td.date/libelle/montant → td.tx-when/what/amount).", "danger");
      journal("Relancez la synchro : le robot cherche encore ses anciens <td>…", "danger");
      btnRefonte.disabled = true;
    });

    btnReset.addEventListener("click", function () {
      inputId.value = "";
      inputPwd.value = "";
      inputId.classList.remove("is-filled");
      inputPwd.classList.remove("is-filled");
      loginCard.style.display = "";
      dash.classList.remove("show");
      btnLogin2.disabled = true;
      leak.hidden = true;
      hint.textContent = "Le formulaire est vide.";
      extracted.innerHTML = '<h4>Données extraites du DOM</h4><div class="empty">Aucune donnée pour l’instant. Lancez la synchro.</div>';
      restoreOriginal();
      journal = makeLogger($("journal-2"));
      $("journal-2").innerHTML = '<div class="line"><span class="t">—</span><span class="msg">En attente… Cliquez sur « Lancer la synchro MonBuddy ».</span></div>';
      $("journal-2").dataset.started = "0";
      btnScrape.disabled = false;
      btnReset.disabled = false;
      journal("Réinitialisé (HTML d’origine restauré).", "ok");
    });
  })();

})();
