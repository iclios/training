const actorCopy = {
  emetteur: {
    title: "Banque émettrice (Issuer)",
    text: "Gère le compte du porteur, décide approve/decline, porte le risque crédit et une grande partie de la fraude côté carte.",
  },
  acquereur: {
    title: "Banque acquéreuse (Acquirer)",
    text: "Agrège les marchands, reçoit les demandes depuis le terminal / PSP, crédite le commerçant après settlement.",
  },
  reseau: {
    title: "Réseau / Scheme",
    text: "Visa, Mastercard… Routage des messages, règles du jeu, clearing entre banques, standards (dont cadre EMVCo).",
  },
  psp: {
    title: "PSP & Fintechs",
    text: "Payment Service Provider : gateway, acceptation multi-acquéreurs, APIs marchandes. Souvent le premier SI vu par le commerçant.",
  },
  device: {
    title: "Devices / POS",
    text: "Terminaux de paiement, pinpads, mPOS. Point d’entrée physique du flux — certification et sécurité du hardware comptent.",
  },
  wallet: {
    title: "Wallet providers",
    text: "Apple Pay, Google Pay… Acteurs de l’écosystème dès J1 ; leur mécanique interne (token, SE/HCE) est traitée en J4.",
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

bindPanel("#diagram-ecosystem", actorCopy, "actor-detail", "data-node");
bindPanel("#diagram-chain", chainCopy, "chain-detail", "data-chain");
