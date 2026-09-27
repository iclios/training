window.actorCopy = {
  porteur: {
    title: "Porteur (client)",
    role: "Détient le moyen de paiement et initie l’opération.",
    not: "Ne décide pas de l’autorisation : c’est l’émetteur.",
  },
  emetteur: {
    title: "Banque émettrice (Issuer)",
    role: "Émet le moyen, gère le produit / compte porteur, décide en général approve / decline, porte le risque crédit et une grande part de la fraude côté porteur.",
    not: "Ne contracte pas le commerçant.",
  },
  commercant: {
    title: "Commerçant",
    role: "Accepte le paiement (magasin, site, app). Contractualise l’acceptation avec un acquéreur (ou via un PSP — Payment Service Provider).",
    not: "Ne route pas vers l’émetteur et ne décide pas l’autorisation.",
  },
  acquereur: {
    title: "Banque acquéreuse (Acquirer)",
    role: "Rôle monétique côté marchand : contractualise l’acceptation (souvent), présente les opérations au scheme, porte le risque d’acceptation, crédite le commerçant selon contrat.",
    not: "Ne décide pas à la place de l’émetteur. ≠ PSP (Payment Service Provider) : le PSP peut être distinct, façade, ou la même entité.",
  },
  reseau: {
    title: "Scheme / réseau (Visa, Mastercard…)",
    role: "Règles du jeu, marque, routage des messages, clearing entre participants.",
    not: "Ni la banque du client, ni celle du commerçant — et ce n’est en général pas lui qui « autorise ».",
  },
  psp: {
    title: "PSP (Payment Service Provider)",
    role: "Prestataire de services de paiement.",
    bullets: [
      "L’acceptation se complexifie : e-commerce, multi-canal, plusieurs moyens à gérer, besoin d’APIs / d’un gateway — le commerçant ne traite plus seul avec une banque acquéreuse.",
      "Le PSP se place entre le commerçant et le rôle d’acquéreur.",
      "Il fournit le checkout ou le lien terminal, agrège les moyens et route les opérations.",
      "Deux cas : façade devant une banque, ou PSP qui est lui-même acquéreur (licence / scheme).",
    ],
    not: "PSP ≠ toujours distinct de l’acquéreur — regarder le contrat et le statut scheme.",
  },
  device: {
    title: "Device / POS (Point of Sale)",
    role: "Point d’entrée physique chez le commerçant : TPE (terminal de paiement électronique), pinpad, mPOS. Capture et initie.",
    not: "Ne remplace ni l’acquéreur ni l’émetteur.",
  },
  wallet: {
    title: "Wallet provider",
    role: "Canal côté porteur (Apple Pay, Google Pay…). S’ajoute à l’écosystème.",
    not: "Ne remplace pas l’émetteur. Mécanique token / SE = Jour 4.",
  },
};

window.chainCopy = {
  client: {
    title: "Client / porteur",
    text: "Présente la carte (ou le mobile). En modèle classique, c’est son PAN qui part dans la demande d’autorisation.",
  },
  terminal: {
    title: "Terminal (POS / mPOS)",
    text: "Capture le montant, lit la carte, construit le message d’auth, affiche le résultat. Première brique SI côté acceptation.",
  },
  acquereur: {
    title: "Acquéreur",
    text: "Maillon côté acceptation face au scheme. Derrière lui (ou confondu avec lui) : gateway / PSP selon le montage — voir les 3 variantes.",
  },
  reseau: {
    title: "Réseau carte",
    text: "Aiguillage vers la bonne banque émettrice, application des règles scheme, base du clearing ultérieur.",
  },
  emetteur: {
    title: "Émetteur",
    text: "Dernière décision : solde, plafonds, scoring fraude, statut carte. Renvoie le code d’autorisation ou le motif de rejet.",
  },
};

function bindPanel(selector, map, panelId, attr) {
  const root = document.querySelector(selector);
  const panel = document.getElementById(panelId);
  if (!root || !panel) return;

  function setActive(key) {
    root.querySelectorAll(".node-hit, .schema-key").forEach((n) => {
      n.classList.toggle("is-active", n.getAttribute(attr) === key);
    });
  }

  function show(key) {
    const data = map[key];
    if (!data) return;

    const placeholder = panel.querySelector(".detail-placeholder");
    const body = panel.querySelector(".detail-body");
    const titleEl = panel.querySelector("h4");
    const roleEl = panel.querySelector("[data-detail-role]");
    const notEl = panel.querySelector("[data-detail-not]");
    const textEl =
      panel.querySelector("[data-detail-text]") ||
      (!roleEl ? panel.querySelector("p") : null);

    if (placeholder) placeholder.hidden = true;
    if (body) body.removeAttribute("hidden");
    panel.hidden = false;
    panel.classList.add("is-filled");

    if (titleEl) titleEl.textContent = data.title || "";

    let bulletsEl = panel.querySelector("[data-detail-bullets]");
    if (data.bullets && data.bullets.length) {
      if (!bulletsEl) {
        bulletsEl = document.createElement("ul");
        bulletsEl.setAttribute("data-detail-bullets", "");
        bulletsEl.className = "detail-bullets";
        if (roleEl) roleEl.after(bulletsEl);
        else if (titleEl) titleEl.after(bulletsEl);
        else body.prepend(bulletsEl);
      }
      bulletsEl.innerHTML = "";
      data.bullets.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        bulletsEl.appendChild(li);
      });
      bulletsEl.hidden = false;
    } else if (bulletsEl) {
      bulletsEl.hidden = true;
      bulletsEl.innerHTML = "";
    }

    if (roleEl && (data.role || data.not || data.bullets)) {
      roleEl.textContent = data.role || "";
      roleEl.hidden = !data.role;
      if (notEl) {
        notEl.textContent = data.not || "";
        notEl.hidden = !data.not;
      }
      if (textEl) textEl.hidden = true;
    } else if (textEl) {
      textEl.hidden = false;
      textEl.textContent = data.text || "";
      if (roleEl) roleEl.hidden = true;
      if (notEl) notEl.hidden = true;
    }

    setActive(key);
  }

  // Délégation : fiable pour SVG (<g>) et boutons HTML
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.closest) return;
    const node = target.closest(".node-hit, .schema-key");
    if (!node || !root.contains(node)) return;
    const key = node.getAttribute(attr);
    if (!key) return;
    event.preventDefault();
    show(key);
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target;
    if (!target || !target.closest) return;
    const node = target.closest(".node-hit, .schema-key");
    if (!node || !root.contains(node)) return;
    const key = node.getAttribute(attr);
    if (!key) return;
    event.preventDefault();
    show(key);
  });
}

bindPanel("#diagram-issuer", window.actorCopy, "actor-detail-issuer", "data-node");
bindPanel("#diagram-acquirer", window.actorCopy, "actor-detail-acquirer", "data-node");
bindPanel("#diagram-scheme", window.actorCopy, "actor-detail-scheme", "data-node");
bindPanel("#diagram-global", window.actorCopy, "actor-detail-global", "data-node");
bindPanel("#diagram-card", window.actorCopy, "actor-detail-card", "data-node");
bindPanel("#diagram-satellites", window.actorCopy, "actor-detail-satellites", "data-node");
bindPanel("#diagram-chain", window.chainCopy, "chain-detail", "data-chain");
