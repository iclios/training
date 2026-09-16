const actorCopy = {
  porteur: {
    title: "Porteur (client)",
    text: "Détient le moyen de paiement et initie l’opération. Ne décide pas de l’autorisation : c’est l’émetteur.",
  },
  emetteur: {
    title: "Banque émettrice (Issuer)",
    text: "Émet le moyen, gère le produit / compte porteur, décide en général approve / decline, porte le risque crédit et une grande part de la fraude côté porteur. Ne contracte pas le commerçant.",
  },
  commercant: {
    title: "Commerçant",
    text: "Accepte le paiement (magasin, site, app). Contractualise l’acceptation avec un acquéreur (ou via un PSP). Ne route pas vers l’émetteur et ne décide pas l’autorisation.",
  },
  acquereur: {
    title: "Banque acquéreuse (Acquirer)",
    text: "Contractualise le commerçant (directement ou via intermédiaires), reçoit les opérations d’acceptation, route vers le scheme, crédite le marchand selon contrat. Ne décide pas à la place de l’émetteur.",
  },
  reseau: {
    title: "Scheme / réseau (Visa, Mastercard…)",
    text: "Règles du jeu, marque, routage des messages, clearing entre participants. Ni la banque du client, ni celle du commerçant — et ce n’est en général pas lui qui « autorise ».",
  },
  psp: {
    title: "PSP / Fintech",
    text: "Façade d’acceptation : gateway, APIs, agrégation. Peut porter tout ou partie de l’acquiring selon licence et montage — souvent confondu avec l’acquéreur, ce n’est pas toujours exact en droit.",
  },
  device: {
    title: "Device / POS",
    text: "Point d’entrée physique (POS, pinpad, mPOS) chez le commerçant. Capture et initie ; ne remplace ni l’acquéreur ni l’émetteur.",
  },
  wallet: {
    title: "Wallet provider",
    text: "Canal côté porteur (Apple Pay, Google Pay…). S’ajoute à l’écosystème ; ne remplace pas l’émetteur. Mécanique token / SE = Jour 4.",
  },
};

const chainCopy = {
  client: {
    title: "Client / porteur",
    text: "Présente la carte (ou le mobile). En modèle classique, c’est son PAN qui part dans la demande d’autorisation.",
  },
  terminal: {
    title: "Terminal (POS / mPOS)",
    text: "Capture le montant, lit la carte, construit le message d’auth, affiche le résultat. Première brique SI côté acceptation.",
  },
  acquereur: {
    title: "Acquéreur (+ gateway / PSP)",
    text: "Reçoit le flux marchand, contrôle de forme, route vers le bon réseau. Souvent derrière une payment gateway.",
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

  const titleEl = panel.querySelector("h4");
  const textEl = panel.querySelector("p");

  function show(key) {
    const data = map[key];
    if (!data) return;
    panel.hidden = false;
    titleEl.textContent = data.title;
    textEl.textContent = data.text;
    root.querySelectorAll(".node-hit").forEach((n) => {
      n.classList.toggle("is-active", n.getAttribute(attr) === key);
    });
  }

  root.querySelectorAll(".node-hit").forEach((node) => {
    const key = node.getAttribute(attr);
    const activate = () => show(key);
    node.addEventListener("click", activate);
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });
}

bindPanel("#diagram-issuer", actorCopy, "actor-detail-issuer", "data-node");
bindPanel("#diagram-acquirer", actorCopy, "actor-detail-acquirer", "data-node");
bindPanel("#diagram-scheme", actorCopy, "actor-detail-scheme", "data-node");
bindPanel("#diagram-global", actorCopy, "actor-detail-global", "data-node");
bindPanel("#diagram-card", actorCopy, "actor-detail-card", "data-node");
bindPanel("#diagram-satellites", actorCopy, "actor-detail-satellites", "data-node");
bindPanel("#diagram-chain", chainCopy, "chain-detail", "data-chain");
