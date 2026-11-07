/**
 * Banque de questions — examen standalone
 * Difficultés : tres-faible | faible | moyen | difficile
 * Types : unique | qcm | ordre | libre | schema | action
 * Barème indicatif : somme des points = 20 (noteMax /20).
 * Libres & actions = poids le plus élevé ; 5 schémas répartis.
 *
 * correct / order / slots / ideeDirectrice : correction formateur
 */
window.EXAMEN_META = {
  "title": "Examen — Paiements digitaux & wallets numériques",
  "durationMin": 60,
  "version": "2026-10-enrol-clarify",
  "noteMax": 20,
  "consignes": [
    "Durée indicative : 1 heure.",
    "Travaillez seul·e, sans consultation des supports pendant l’épreuve.",
    "Certaines questions « Action » demandent d’utiliser votre téléphone (scan, réglages, app…).",
    "Aucune note ne s’affiche à la fin — vos réponses sont exportées pour relecture.",
    "Pensez à exporter / télécharger vos réponses avant de fermer la page."
  ]
};

window.EXAMEN_QUESTIONS = [
  {
    "id": "j1-acs",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Socle monétique",
    "diff": "tres-faible",
    "charge": 1,
    "points": 0.25,
    "type": "ordre",
    "prompt": "Remettez dans l’ordre la chaîne monétique classique.",
    "hint": "Glissez les étapes (haut = début).",
    "items": [
      "Settlement",
      "Authorization (AuthZ)",
      "Clearing"
    ],
    "order": [
      "Authorization (AuthZ)",
      "Clearing",
      "Settlement"
    ]
  },
  {
    "id": "j1-acteur-authz",
    "image": "img/acteurs/acteur-banque.jpg",
    "jour": "J1",
    "theme": "Acteurs",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "Qui prend en général la décision d’autorisation (approve / decline) sur le compte porteur ?",
    "choices": [
      {
        "id": "a",
        "label": "L’émetteur (issuer)"
      },
      {
        "id": "b",
        "label": "Le commerçant"
      },
      {
        "id": "c",
        "label": "L’acquéreur seul"
      },
      {
        "id": "d",
        "label": "Le fabricant de terminal"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j1-pan",
    "image": "img/token/pan-carte.svg",
    "jour": "J1",
    "theme": "Données carte",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "Le PAN désigne principalement…",
    "choices": [
      {
        "id": "a",
        "label": "Le code PIN chiffré"
      },
      {
        "id": "b",
        "label": "Le numéro de compte primaire de la carte"
      },
      {
        "id": "c",
        "label": "Le montant autorisé"
      },
      {
        "id": "d",
        "label": "L’identifiant du terminal"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j1-acquereur",
    "image": "img/acteurs/acteur-psp.jpg",
    "jour": "J1",
    "theme": "Acteurs",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "L’acquéreur intervient surtout pour…",
    "choices": [
      {
        "id": "a",
        "label": "Remplacer le scheme Visa / Mastercard"
      },
      {
        "id": "b",
        "label": "Tenir le compte du porteur et décider l’AuthZ finale"
      },
      {
        "id": "c",
        "label": "Accepter le commerçant et acheminer la transaction vers le réseau / l’émetteur"
      },
      {
        "id": "d",
        "label": "Émettre la carte plastique"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "j1-offline-degrade",
    "image": "img/acteurs/acteur-device.jpg",
    "jour": "J1",
    "theme": "Online / offline",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "En monétique, on distingue notamment l’offline « normal » et l’offline « dégradé ». Quelle affirmation décrit correctement l’offline dégradé ?",
    "hint": "Pensez à la différence entre mode prévu et mode de secours.",
    "choices": [
      {
        "id": "a",
        "label": "C’est uniquement le scan d’un QR sans montant"
      },
      {
        "id": "b",
        "label": "C’est le mode prévu au quotidien par le produit (seuils, floor limit…), même quand la chaîne online fonctionne parfaitement"
      },
      {
        "id": "c",
        "label": "C’est l’étape Settlement, toujours faite sans l’émetteur"
      },
      {
        "id": "d",
        "label": "C’est un mode de secours : la chaîne online est indisponible (ex. host down), on retombe sur des contrôles locaux / règles de fallback"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "j1-qcm-chaine",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Socle monétique",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes après une autorisation approve en caisse.",
    "hint": "Plusieurs réponses possibles — 2 bonnes réponses.",
    "choices": [
      {
        "id": "a",
        "label": "Dès l’approve, plus aucune étape n’existe côté réseaux / banques"
      },
      {
        "id": "b",
        "label": "Il peut encore rester des traitements après la décision d’autorisation (présentation, compensation, règlement…)"
      },
      {
        "id": "c",
        "label": "Un approve ne signifie pas que le règlement financier entre banques / acteurs est déjà terminé"
      }
    ],
    "correct": [
      "b",
      "c"
    ]
  },
  {
    "id": "j1-qcm-acteurs",
    "image": "img/acteurs/acteur-porteur.jpg",
    "jour": "J1",
    "theme": "Acteurs",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez ce qui est correct concernant les acteurs d’une transaction carte.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Le commerçant remplace l’émetteur pour l’autorisation finale"
      },
      {
        "id": "b",
        "label": "Le scheme (réseau) orchestre souvent l’acheminement entre acquéreur et émetteur"
      },
      {
        "id": "c",
        "label": "L’émetteur tient en général le compte du porteur et décide l’AuthZ"
      },
      {
        "id": "d",
        "label": "L’acquéreur contractualise / achemine plutôt côté commerçant"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j1-qcm-organismes",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Normes",
    "diff": "moyen",
    "charge": 2.5,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur les organismes / référentiels (ISO, EMVCo, schemes, NFC Forum…).",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "NFC Forum remplace EMVCo pour l’Authorization et le Settlement"
      },
      {
        "id": "b",
        "label": "Un scheme (Visa / Mastercard / CB…) fixe surtout les règles métier entre participants — ni norme ISO ni spec EMVCo"
      },
      {
        "id": "c",
        "label": "EMVCo publie des specs produit paiement (Chip, Contactless, 3DS, QR, Token) — ce n’est pas une norme ISO"
      },
      {
        "id": "d",
        "label": "ISO publie des normes techniques (ex. 8583, 14443, 20022) : « comment parler / transporter »"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j1-iso-8583",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "ISO 8583, dans le socle monétique, sert surtout à…",
    "choices": [
      {
        "id": "a",
        "label": "Décrire la grammaire des messages monétiques (ex. autorisation) entre systèmes"
      },
      {
        "id": "b",
        "label": "Définir le design graphique des QR EMV"
      },
      {
        "id": "c",
        "label": "Remplacer le Secure Element du téléphone"
      },
      {
        "id": "d",
        "label": "Fixer l’interchange Visa / Mastercard"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j1-iso-20022",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "Par rapport à ISO 8583, ISO 20022 est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "La norme radio du tap NFC"
      },
      {
        "id": "b",
        "label": "Un autre cadre de messaging (souvent cité pour SEPA / rails modernes) — distinct de l’ISO 8583"
      },
      {
        "id": "c",
        "label": "La spec EMVCo de tokenisation réseau"
      },
      {
        "id": "d",
        "label": "Le standard PCI-DSS de stockage du PAN"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j1-wallet-stack",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J1",
    "theme": "Normes",
    "diff": "moyen",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Un wallet de paiement NFC / tokenisé, côté normes, c’est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Uniquement le NFC Forum, sans EMV"
      },
      {
        "id": "b",
        "label": "Uniquement ISO 20022"
      },
      {
        "id": "c",
        "label": "Un empilement (ex. 14443 + EMV Contactless + tokenisation) — pas une norme ISO unique « wallet »"
      },
      {
        "id": "d",
        "label": "Uniquement PCI-DSS à la place d’EMVCo"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "j1-libre-chaine",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Socle monétique",
    "diff": "moyen",
    "charge": 3,
    "points": 2,
    "type": "libre",
    "prompt": "En 3–5 phrases, expliquez ce que couvrent respectivement l’autorisation, la compensation (clearing) et le règlement (settlement), et pourquoi une acceptation en caisse ne clôt pas tout le cycle côté banque.",
    "hint": "Réponse courte, idée principale — pas un cours complet.",
    "placeholder": "Votre réponse…",
    "ideeDirectrice": "AuthZ = décision sur le compte ; clearing = présentation / compensation ; settlement = règlement financier. Un approve en caisse ne clôt pas le cycle banque."
  },
  {
    "id": "schema-acs",
    "image": "img/evolution/evo-carte.svg",
    "jour": "J1",
    "theme": "Schéma chaîne monétique",
    "diff": "faible",
    "charge": 2.5,
    "points": 0.75,
    "type": "schema",
    "prompt": "Schéma « chaîne monétique ». Placez les 3 étapes dans l’ordre chronologique, de gauche (début) à droite (fin).",
    "hint": "Une seule bonne réponse par case · ordre strict.",
    "schemaTitle": "Chaîne monétique · 3 étapes",
    "schemaSubtitle": "Placez les 3 étiquettes dans l’ordre chronologique (gauche → droite).",
    "viewBox": "0 0 1000 260",
    "decor": [
      {
        "type": "arrow",
        "x1": 310,
        "y1": 130,
        "x2": 370,
        "y2": 130
      },
      {
        "type": "arrow",
        "x1": 620,
        "y1": 130,
        "x2": 680,
        "y2": 130
      },
      {
        "type": "note",
        "x": 500,
        "y": 230,
        "text": "Gauche = début du flux · Droite = fin"
      }
    ],
    "slots": [
      {
        "id": "a1",
        "x": 70,
        "y": 90,
        "w": 230,
        "h": 80,
        "caption": "① Début",
        "placeholder": "Étape ?"
      },
      {
        "id": "a2",
        "x": 385,
        "y": 90,
        "w": 230,
        "h": 80,
        "caption": "② Ensuite",
        "placeholder": "Étape ?"
      },
      {
        "id": "a3",
        "x": 700,
        "y": 90,
        "w": 230,
        "h": 80,
        "caption": "③ Fin",
        "placeholder": "Étape ?"
      }
    ],
    "palette": [
      "Settlement",
      "Authorization (AuthZ)",
      "Clearing"
    ],
    "correctSlots": {
      "a1": "Authorization (AuthZ)",
      "a2": "Clearing",
      "a3": "Settlement"
    }
  },
  {
    "id": "j2-qr-entree",
    "image": "img/qr/qr-paiement-demo.png",
    "jour": "J2",
    "theme": "Canal QR",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Dans une plateforme omnicanale, le QR est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Un remplacement du settlement"
      },
      {
        "id": "b",
        "label": "Un token device stocké en SE"
      },
      {
        "id": "c",
        "label": "Un scheme qui autorise à la place de l’émetteur"
      },
      {
        "id": "d",
        "label": "Un rail d’entrée / d’initiation du paiement"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "act-qr-url",
    "jour": "J2",
    "theme": "Action · téléphone",
    "diff": "faible",
    "charge": 2,
    "points": 0.5,
    "type": "action",
    "actionKind": "scan-qr",
    "actionLabel": "Scannez le QR affiché ci-dessous avec la caméra de votre téléphone.",
    "image": "img/qr/qr-url-demo.png",
    "prompt": "Qu’observez-vous ? De quel type de payload s’agit-il ? Recopiez le contenu lu.",
    "fields": [
      {
        "id": "obs",
        "label": "Qu’observez-vous sur le téléphone ?",
        "kind": "libre",
        "placeholder": "Décrivez ce que le téléphone propose…"
      },
      {
        "id": "stype",
        "label": "Type de payload",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "URL (lien web)"
          },
          {
            "id": "b",
            "label": "Fiche contact (MECARD)"
          },
          {
            "id": "c",
            "label": "Configuration Wi‑Fi"
          },
          {
            "id": "d",
            "label": "Payload EMV QR de paiement"
          }
        ]
      },
      {
        "id": "payload",
        "label": "Payload / contenu lu (recopiez)",
        "kind": "libre",
        "placeholder": "Recopiez exactement ce qui est lu…"
      }
    ],
    "correct": {
      "stype": [
        "a"
      ],
      "payloadHint": "https://exemple.com/menu"
    }
  },
  {
    "id": "j2-statique-dyn",
    "image": "img/qr/qr-emv-mpm-demo.png",
    "jour": "J2",
    "theme": "Canal QR",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.15,
    "type": "unique",
    "prompt": "Quel est l’intérêt principal d’un QR dynamique (montant / TTL) par rapport à un QR statique ?",
    "choices": [
      {
        "id": "a",
        "label": "Réduit surtout le risque de réutilisation / montant figé"
      },
      {
        "id": "b",
        "label": "Oblige à utiliser le NFC"
      },
      {
        "id": "c",
        "label": "Supprime le besoin d’AuthZ"
      },
      {
        "id": "d",
        "label": "Change le settlement en temps réel"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j2-silo",
    "image": "img/qr/qr-paiement-demo.png",
    "jour": "J2",
    "theme": "Intégration QR",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.15,
    "type": "unique",
    "prompt": "On ajoute le paiement par QR à côté de la carte. Quelle erreur d’intégration faut-il surtout éviter ?",
    "choices": [
      {
        "id": "a",
        "label": "Utiliser le même journal de transactions que la carte"
      },
      {
        "id": "b",
        "label": "Traiter le QR code dans un silo à part"
      },
      {
        "id": "c",
        "label": "Passer les demandes par un PSP"
      },
      {
        "id": "d",
        "label": "Garder les mêmes grandes étapes monétiques que pour la carte (décision, compensation, règlement…)"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j2-qcm-qr",
    "image": "img/qr/qr-paiement-demo.png",
    "jour": "J2",
    "theme": "Canal QR",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur les QR en paiement / initiation.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Tout QR scanné ouvre forcément un site web https"
      },
      {
        "id": "b",
        "label": "Un QR de paiement métier peut nécessiter une app compatible pour être interprété"
      },
      {
        "id": "c",
        "label": "Un QR dynamique (montant / TTL) limite surtout la réutilisation d’un QR figé"
      },
      {
        "id": "d",
        "label": "Un QR peut transporter différents types de payload (URL, Wi‑Fi, métier paiement…)"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j2-emv-qr-vs-chip",
    "image": "img/qr/qr-paiement-demo.png",
    "jour": "J2",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "EMV QR Code par rapport à EMV « carte à puce / contactless » ?",
    "choices": [
      {
        "id": "a",
        "label": "EMV QR est une norme ISO, pas une spec EMVCo"
      },
      {
        "id": "b",
        "label": "EMV QR remplace ISO 14443 pour tous les taps POS"
      },
      {
        "id": "c",
        "label": "Même famille EMVCo, autre objet : QR = payload / initiation — ce n’est pas la même chose que la puce EMV"
      },
      {
        "id": "d",
        "label": "EMV QR = uniquement le Settlement SEPA"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "act-qr-wifi",
    "jour": "J2",
    "theme": "Action · téléphone",
    "diff": "moyen",
    "charge": 3,
    "points": 0.75,
    "type": "action",
    "actionKind": "scan-qr",
    "actionLabel": "Scannez ce QR avec votre téléphone (ne vous connectez pas au réseau).",
    "image": "img/qr/qr-wifi-demo.png",
    "prompt": "Identifiez le type de payload et les éléments proposés (sécurité, SSID, mot de passe…).",
    "fields": [
      {
        "id": "stype",
        "label": "Type de payload",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "URL web"
          },
          {
            "id": "b",
            "label": "Configuration Wi‑Fi"
          },
          {
            "id": "c",
            "label": "SMS"
          },
          {
            "id": "d",
            "label": "MECARD (contact)"
          }
        ]
      },
      {
        "id": "detail",
        "label": "Que propose le téléphone ? Quels champs voyez-vous ?",
        "kind": "libre",
        "placeholder": "Décrivez ce que l’écran propose…"
      },
      {
        "id": "payload",
        "label": "Payload brut si visible (ou recopié)",
        "kind": "libre",
        "placeholder": "Recopiez le contenu brut si visible…"
      }
    ],
    "correct": {
      "stype": [
        "b"
      ],
      "payloadHint": "WIFI:T:WPA;S:CafeDemo;P:demo1234;;"
    }
  },
  {
    "id": "j3-dpan",
    "image": "img/token/token-icon.svg",
    "jour": "J3",
    "theme": "Tokenisation",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Un token de paiement (ex. DPAN) sert surtout à…",
    "choices": [
      {
        "id": "a",
        "label": "Remplacer l’émetteur"
      },
      {
        "id": "b",
        "label": "Faire le clearing à la place du scheme"
      },
      {
        "id": "c",
        "label": "Supprimer le cryptogramme"
      },
      {
        "id": "d",
        "label": "Remplacer le PAN dans les flux, sans exposer le PAN en clair partout"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "j3-tsp",
    "image": "img/acteurs/acteur-scheme.jpg",
    "jour": "J3",
    "theme": "Tokenisation",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Le TSP (Token Service Provider) intervient principalement pour…",
    "choices": [
      {
        "id": "a",
        "label": "Gérer le cycle de vie des tokens et le coffre associé (provisioning, suspension, etc.)"
      },
      {
        "id": "b",
        "label": "Imprimer les cartes plastiques"
      },
      {
        "id": "c",
        "label": "Remplacer le POS"
      },
      {
        "id": "d",
        "label": "Tenir le compte courant du porteur"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j3-qcm-token",
    "image": "img/token/token-exemple.svg",
    "jour": "J3",
    "theme": "Tokenisation",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur la tokenisation carte.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Le token peut avoir un domaine d’usage (device, e-com…)"
      },
      {
        "id": "b",
        "label": "Apple / Google deviennent l’émetteur du compte"
      },
      {
        "id": "c",
        "label": "La détokenisation côté réseau / TSP permet de retrouver le PAN pour l’AuthZ"
      },
      {
        "id": "d",
        "label": "Le cryptogramme contribue à l’unicité / fraîcheur de la transaction"
      }
    ],
    "correct": [
      "a",
      "c",
      "d"
    ]
  },
  {
    "id": "j3-qcm-pci-sca",
    "image": "img/token/token-icon.svg",
    "jour": "J3",
    "theme": "Normes",
    "diff": "moyen",
    "charge": 2.5,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur PCI-DSS, SCA/DSP2 et tokenisation.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Dès qu’il y a un token, la SCA / DSP2 n’existe plus et le PAN peut être stocké librement"
      },
      {
        "id": "b",
        "label": "PCI-DSS porte surtout sur la protection des données de cartes (scope, stockage, transmission…)"
      },
      {
        "id": "c",
        "label": "Tokeniser peut réduire le scope PCI côté acceptation (moins de PAN) — sans supprimer tous les contrôles"
      },
      {
        "id": "d",
        "label": "SCA / DSP2 authentifie surtout le porteur — tokeniser ≠ authentifier le porteur"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j3-vts-mdes",
    "image": "img/token/token-exemple.svg",
    "jour": "J3",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "VTS et MDES désignent surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Les modes NFC Forum peer-to-peer uniquement"
      },
      {
        "id": "b",
        "label": "Les services TSP / tokenisation réseau des schemes (Visa / Mastercard)"
      },
      {
        "id": "c",
        "label": "Les normes radio ISO 14443 Type A et Type B"
      },
      {
        "id": "d",
        "label": "Les messages ISO 20022 de Settlement SEPA"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j3-libre-token",
    "image": "img/token/token-icon.svg",
    "jour": "J3",
    "theme": "Tokenisation",
    "diff": "moyen",
    "charge": 3,
    "points": 1.5,
    "type": "libre",
    "prompt": "Pourquoi remplace-t-on le PAN par un token dans un wallet ? En 3–5 phrases, expliquez le gain principal (ce qui est exposé au POS / marchand, et ce qui reste côté émetteur).",
    "hint": "Réponse courte, idée principale — pas un cours complet.",
    "placeholder": "Votre réponse…",
    "ideeDirectrice": "Moins de PAN en clair sur la chaîne d’acceptation (POS / marchand) ; le token circule ; l’émetteur garde la décision AuthZ (via détokenisation / TSP)."
  },
  {
    "id": "schema-token",
    "image": "img/token/token-exemple.svg",
    "jour": "J3",
    "theme": "Schéma tokenisation",
    "diff": "moyen",
    "charge": 3,
    "points": 0.75,
    "type": "schema",
    "prompt": "Schéma d’une autorisation tokenisée (wallet). Placez ce qui circule ou qui intervient à chaque étape — du device jusqu’à la décision sur le compte.",
    "hint": "Une étiquette par case.",
    "schemaTitle": "Flux tokenisé · device → AuthZ",
    "schemaSubtitle": "Device · acceptation · coffre / détokenisation · décision émetteur.",
    "viewBox": "0 0 1000 280",
    "decor": [
      {
        "type": "arrow",
        "x1": 230,
        "y1": 120,
        "x2": 270,
        "y2": 120
      },
      {
        "type": "arrow",
        "x1": 470,
        "y1": 120,
        "x2": 510,
        "y2": 120
      },
      {
        "type": "arrow",
        "x1": 710,
        "y1": 120,
        "x2": 750,
        "y2": 120
      },
      {
        "type": "note",
        "x": 500,
        "y": 250,
        "text": "Le POS / acquéreur ne stockent pas le PAN d’origine"
      }
    ],
    "slots": [
      {
        "id": "t1",
        "x": 30,
        "y": 60,
        "w": 190,
        "h": 110,
        "caption": "① Sur le device",
        "placeholder": "…"
      },
      {
        "id": "t2",
        "x": 280,
        "y": 60,
        "w": 180,
        "h": 110,
        "caption": "② Au POS / acquéreur",
        "placeholder": "…"
      },
      {
        "id": "t3",
        "x": 520,
        "y": 60,
        "w": 180,
        "h": 110,
        "caption": "③ Coffre / détokenisation",
        "placeholder": "…"
      },
      {
        "id": "t4",
        "x": 760,
        "y": 60,
        "w": 210,
        "h": 110,
        "caption": "④ Décision compte",
        "placeholder": "…"
      }
    ],
    "palette": [
      "Token / credential (SE ou HCE)",
      "Token présenté (pas le PAN)",
      "TSP",
      "Émetteur (AuthZ)"
    ],
    "correctSlots": {
      "t1": "Token / credential (SE ou HCE)",
      "t2": "Token présenté (pas le PAN)",
      "t3": "TSP",
      "t4": "Émetteur (AuthZ)"
    }
  },
  {
    "id": "j4-14443",
    "image": "img/nfc/puce-nfc-vs-paiement.svg",
    "jour": "J4",
    "theme": "NFC / RF",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "ISO/IEC 14443, dans le paiement sans contact, c’est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Le settlement"
      },
      {
        "id": "b",
        "label": "La logique AuthZ métier"
      },
      {
        "id": "c",
        "label": "Le tuyau radio de proximité (carte ↔ lecteur)"
      },
      {
        "id": "d",
        "label": "Le ledger mobile money"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "j4-type-a",
    "image": "img/acteurs/acteur-device.jpg",
    "jour": "J4",
    "theme": "NFC / RF",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Pour le tap carte / wallet au POS, le chemin radio dominant du paiement est…",
    "choices": [
      {
        "id": "a",
        "label": "Type B exclusivement"
      },
      {
        "id": "b",
        "label": "Uniquement des tags NFC Forum / NDEF"
      },
      {
        "id": "c",
        "label": "Bluetooth"
      },
      {
        "id": "d",
        "label": "Type A (les POS sont souvent dual A+B pour l’interopérabilité)"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "j4-qcm-normes",
    "image": "img/nfc/puce-nfc-vs-paiement.svg",
    "jour": "J4",
    "theme": "Normes",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur l’empilement des normes (proximité / paiement).",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "NFC Forum = spécification complète de l’Authorization bancaire"
      },
      {
        "id": "b",
        "label": "ISO/IEC 14443 = couche radio de proximité (carte ↔ lecteur)"
      },
      {
        "id": "c",
        "label": "EMV Contactless = logique métier / application paiement au-dessus de la radio"
      },
      {
        "id": "d",
        "label": "NFC Forum décrit surtout des usages device / tags sur le tuyau radio — pas l’AuthZ EMV"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j4-emv-apdu",
    "image": "img/nfc/puce-nfc-vs-paiement.svg",
    "jour": "J4",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.15,
    "type": "unique",
    "prompt": "Dans l’empilement des normes, où se situent les APDU / EMV Contactless par rapport à l’ISO 14443 ?",
    "choices": [
      {
        "id": "a",
        "label": "Au-dessus de la couche radio 14443 (Type A/B) : la radio transporte, EMV porte le contenu paiement"
      },
      {
        "id": "b",
        "label": "Uniquement dans le NFC Forum, jamais en EMV"
      },
      {
        "id": "c",
        "label": "Sous la couche physique 13,56 MHz uniquement, sans lien avec le POS"
      },
      {
        "id": "d",
        "label": "À la place du Settlement"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "act-nfc-reglages",
    "jour": "J4",
    "theme": "Action · téléphone",
    "diff": "faible",
    "charge": 3,
    "points": 0.75,
    "type": "action",
    "actionKind": "phone",
    "actionLabel": "Ouvrez les réglages de votre téléphone et cherchez NFC / Sans contact (ou Connexions).",
    "prompt": "Votre appareil expose-t-il le NFC ? Que pouvez-vous activer / désactiver ? Reliez à ce que permet un paiement de proximité.",
    "hint": "Pas besoin de payer : observation des réglages uniquement.",
    "fields": [
      {
        "id": "present",
        "label": "NFC présent sur cet appareil ?",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "Oui — option visible dans les réglages"
          },
          {
            "id": "b",
            "label": "Non — aucune option NFC / sans contact trouvée"
          },
          {
            "id": "c",
            "label": "Incertain — menu différent / droits insuffisants"
          }
        ]
      },
      {
        "id": "obs",
        "label": "Ce que vous voyez (libellés, interrupteur, avertissements…)",
        "kind": "libre",
        "placeholder": "Décrivez brièvement l’écran réglages…"
      },
      {
        "id": "lien",
        "label": "Lien avec le paiement de proximité (1–2 phrases)",
        "kind": "libre",
        "placeholder": "Votre lien en 1–2 phrases…"
      }
    ],
    "correct": {
      "idea": "NFC = canal RF proximité ; sans NFC (ou désactivé) pas de tap wallet classique."
    }
  },
  {
    "id": "j4-ce",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Modes NFC",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "Quel mode NFC porte le paiement wallet au POS ?",
    "choices": [
      {
        "id": "a",
        "label": "Peer-to-peer"
      },
      {
        "id": "b",
        "label": "Card emulation"
      },
      {
        "id": "c",
        "label": "Lecture / écriture de tag NDEF uniquement"
      },
      {
        "id": "d",
        "label": "Reader / writer"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j4-se-hce",
    "image": "img/acteurs/acteur-device.jpg",
    "jour": "J4",
    "theme": "Confiance device",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Différence essentielle SE vs HCE (idée) ?",
    "choices": [
      {
        "id": "a",
        "label": "SE interdit le tap NFC"
      },
      {
        "id": "b",
        "label": "HCE = settlement local sur le téléphone"
      },
      {
        "id": "c",
        "label": "SE : le secret long est souvent dans une puce sécurisée ; HCE : émulation logicielle, le coffre long est plutôt côté TSP"
      },
      {
        "id": "d",
        "label": "HCE remplace toujours le POS"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "j4-apple-emetteur",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Wallets",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Dans le modèle carte tokenisée, quel est le rôle d’Apple Pay / Google Pay ?",
    "choices": [
      {
        "id": "a",
        "label": "Ils remplacent ISO 14443"
      },
      {
        "id": "b",
        "label": "Ils sont l’émetteur du compte bancaire"
      },
      {
        "id": "c",
        "label": "Ils font le clearing à la place du scheme"
      },
      {
        "id": "d",
        "label": "Ils orchestrent le wallet / device ; l’émetteur reste la banque (AuthZ compte)"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "j4-qcm-apple",
    "image": "img/atelier/enrol-apple-pay.svg",
    "jour": "J4",
    "theme": "Apple Pay",
    "diff": "moyen",
    "charge": 2.5,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur l’architecture Apple Pay (modèle carte tokenisée).",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "La Secure Enclave gère surtout le CDCVM (Face ID / Touch ID / code)"
      },
      {
        "id": "b",
        "label": "Le credential long vit surtout dans l’eSE (Secure Element)"
      },
      {
        "id": "c",
        "label": "Apple devient l’émetteur du compte et décide l’AuthZ à la place de la banque"
      },
      {
        "id": "d",
        "label": "Le TSP est le seul provisionneur du token vers le device (PassKit → eSE)"
      }
    ],
    "correct": [
      "a",
      "b",
      "d"
    ]
  },
  {
    "id": "j4-apple-enrol-tsp",
    "image": "img/atelier/enrol-apple-pay.svg",
    "jour": "J4",
    "theme": "Apple Pay",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Lors de l’enrolment Apple Pay, après l’accord de l’émetteur, qui pousse le token / credential sur le téléphone ?",
    "choices": [
      {
        "id": "a",
        "label": "Le TSP provisionne le device (PassKit → eSE) ; l’émetteur répond au TSP, pas au SE directement"
      },
      {
        "id": "b",
        "label": "Le POS du commerçant provisionne le wallet"
      },
      {
        "id": "c",
        "label": "L’émetteur envoie directement le DPAN dans l’eSE (canal Issuer → eSE)"
      },
      {
        "id": "d",
        "label": "Le scheme fait le Settlement puis provisionne"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j4-qcm-google",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Google Pay",
    "diff": "moyen",
    "charge": 2.5,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur l’architecture Google Pay (modèle carte tokenisée).",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Google Pay n’utilise jamais de TSP : le PAN voyage en clair au POS"
      },
      {
        "id": "b",
        "label": "Côté POS / acquéreur, l’Auth reste tokenisée — le geste métier ne « voit » pas HCE vs SE"
      },
      {
        "id": "c",
        "label": "Présentation souvent en HCE + TEE (ex. TrustZone) pour CDCVM / protection"
      },
      {
        "id": "d",
        "label": "Le TSP recharge des credentials courts vers le HCE ; le coffre durable (UDK-AC) reste plutôt côté TSP"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "j4-apple-vs-google",
    "image": "img/acteurs/acteur-device.jpg",
    "jour": "J4",
    "theme": "Apple / Google",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Quelle distinction Apple Pay vs Google Pay est la plus juste ?",
    "choices": [
      {
        "id": "a",
        "label": "Google Pay remplace toujours l’émetteur ; Apple Pay ne tokenise jamais"
      },
      {
        "id": "b",
        "label": "Apple : secret long souvent en eSE, TSP surtout vault token + Auth ; Google : souvent émulation logicielle (HCE), avec recharge de credentials courts côté device"
      },
      {
        "id": "c",
        "label": "Apple Pay n’utilise pas le NFC ; Google Pay uniquement le QR"
      },
      {
        "id": "d",
        "label": "Aucune différence : les deux stockent le PAN en clair dans l’app"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j4-apple-tap",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Apple Pay",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Dans le workflow de tap Apple Pay, quel enchaînement est le plus juste ?",
    "choices": [
      {
        "id": "a",
        "label": "PassKit envoie le PAN en clair à l’acquéreur sans TSP"
      },
      {
        "id": "b",
        "label": "Settlement d’abord → puis CDCVM → puis enrolment"
      },
      {
        "id": "c",
        "label": "CDCVM (Enclave) → calcul / présentation eSE au POS (ISO 14443 / EMV CL) → Auth tokenisée via TSP → décision émetteur"
      },
      {
        "id": "d",
        "label": "Le POS détokenise localement le PAN puis appelle Apple"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "schema-tap",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Schéma tap wallet",
    "diff": "moyen",
    "charge": 3,
    "points": 0.75,
    "type": "schema",
    "prompt": "Schéma d’un tap wallet NFC en magasin (ex. Apple Pay). Placez le composant ou l’acteur au bon endroit du parcours.",
    "hint": "Une étiquette par case · ordre du geste de paiement.",
    "schemaTitle": "Tap wallet · proximité → Auth",
    "schemaSubtitle": "Authentifier le porteur · présenter au POS · traverser le réseau.",
    "viewBox": "0 0 1000 280",
    "decor": [
      {
        "type": "arrow",
        "x1": 230,
        "y1": 120,
        "x2": 270,
        "y2": 120
      },
      {
        "type": "arrow",
        "x1": 470,
        "y1": 120,
        "x2": 510,
        "y2": 120
      },
      {
        "type": "arrow",
        "x1": 710,
        "y1": 120,
        "x2": 750,
        "y2": 120
      },
      {
        "type": "note",
        "x": 500,
        "y": 250,
        "text": "Pas l’enrolment : ici c’est le paiement au POS"
      }
    ],
    "slots": [
      {
        "id": "p1",
        "x": 30,
        "y": 60,
        "w": 190,
        "h": 110,
        "caption": "① CDCVM",
        "placeholder": "…"
      },
      {
        "id": "p2",
        "x": 280,
        "y": 60,
        "w": 180,
        "h": 110,
        "caption": "② Présentation NFC",
        "placeholder": "…"
      },
      {
        "id": "p3",
        "x": 520,
        "y": 60,
        "w": 180,
        "h": 110,
        "caption": "③ Acceptation terrain",
        "placeholder": "…"
      },
      {
        "id": "p4",
        "x": 760,
        "y": 60,
        "w": 210,
        "h": 110,
        "caption": "④ Vault / Auth tokenisée",
        "placeholder": "…"
      }
    ],
    "palette": [
      "Secure Enclave / biométrie",
      "eSE (card emulation)",
      "POS",
      "TSP"
    ],
    "correctSlots": {
      "p1": "Secure Enclave / biométrie",
      "p2": "eSE (card emulation)",
      "p3": "POS",
      "p4": "TSP"
    }
  },
  {
    "id": "j4-wallet-compte",
    "image": "img/evolution/evo-mobile.svg",
    "jour": "J4",
    "theme": "Wallets",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Orange Money / Wave / M-Pesa (mobile money) stockent surtout…",
    "choices": [
      {
        "id": "a",
        "label": "La clé IMK-AC de l’émetteur Visa"
      },
      {
        "id": "b",
        "label": "Un DPAN EMV en Secure Element pour répondre au POS comme Apple Pay"
      },
      {
        "id": "c",
        "label": "Uniquement un UID de tag NDEF"
      },
      {
        "id": "d",
        "label": "Un solde / compte sur un ledger opérateur ou fintech"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "j4-qcm-wallets",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Wallets",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur les wallets.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "Un wallet mobile money repose surtout sur un solde / compte opérateur ou fintech"
      },
      {
        "id": "b",
        "label": "Un wallet carte tokenisée (Apple / Google Pay) s’appuie sur un token / credential device pour le tap"
      },
      {
        "id": "c",
        "label": "Apple Pay devient l’émetteur du compte bancaire du porteur"
      },
      {
        "id": "d",
        "label": "CDCVM (biométrie / code) authentifie le porteur sur l’appareil avant / pendant le paiement"
      }
    ],
    "correct": [
      "a",
      "b",
      "d"
    ]
  },
  {
    "id": "act-wallet-app",
    "jour": "J4",
    "theme": "Action · téléphone",
    "diff": "moyen",
    "charge": 3,
    "points": 1,
    "type": "action",
    "actionKind": "phone",
    "actionLabel": "Ouvrez un wallet ou une app de paiement sur votre téléphone s’il y en a une (Apple Pay / Google Wallet / wallet banque / mobile money). Sinon, décrivez l’absence.",
    "prompt": "Observez l’écran d’accueil du wallet (sans initier de paiement). Qu’y a-t-il : cartes / comptes, biométrie, solde, QR… ?",
    "fields": [
      {
        "id": "dispo",
        "label": "Situation",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "J’ai ouvert un wallet carte (Apple / Google / banque…)"
          },
          {
            "id": "b",
            "label": "J’ai ouvert un wallet / app mobile money"
          },
          {
            "id": "c",
            "label": "Aucune app wallet / paiement utilisable ici"
          }
        ]
      },
      {
        "id": "obs",
        "label": "Éléments visibles (cartes masquées, solde, QR, empreinte / Face ID…)",
        "kind": "libre",
        "placeholder": "Ce que l’écran montre vraiment…"
      },
      {
        "id": "type",
        "label": "D’après ce que vous voyez, plutôt…",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "Wallet « carte » (PAN tokenisé / cartes enrolées, prêt pour le tap)"
          },
          {
            "id": "b",
            "label": "Wallet compte / mobile money (solde, envoi, parfois QR)"
          },
          {
            "id": "c",
            "label": "Mixte ou indéterminé / pas d’app"
          }
        ]
      }
    ],
    "correct": {
      "idea": "Distinguer wallet carte (token/tap) vs wallet compte / mobile money (solde, transfert, QR)."
    }
  },
  {
    "id": "j4-qcm-modes",
    "image": "img/acteurs/acteur-wallet.jpg",
    "jour": "J4",
    "theme": "Modes NFC",
    "diff": "moyen",
    "charge": 2,
    "points": 0.25,
    "type": "qcm",
    "prompt": "Cochez les affirmations correctes sur les modes NFC.",
    "hint": "Plusieurs réponses possibles.",
    "choices": [
      {
        "id": "a",
        "label": "NFC Forum = spécification complète de l’AuthZ EMV"
      },
      {
        "id": "b",
        "label": "Le rôle radio « target / passif » décrit la communication NFC — ce n’est pas synonyme de « appareil sans batterie »"
      },
      {
        "id": "c",
        "label": "Card emulation : le téléphone se comporte comme une carte face au POS"
      },
      {
        "id": "d",
        "label": "Reader/writer : le téléphone lit/écrit un tag — pas le paiement POS classique"
      }
    ],
    "correct": [
      "b",
      "c",
      "d"
    ]
  },
  {
    "id": "act-biometrie",
    "jour": "J4",
    "theme": "Action · téléphone",
    "diff": "moyen",
    "charge": 2,
    "points": 0.5,
    "type": "action",
    "actionKind": "phone",
    "actionLabel": "Dans les réglages (ou le wallet), repérez l’authentification biométrique / code pour déverrouiller ou valider un paiement.",
    "prompt": "Quel mécanisme CDCVM-like voyez-vous (empreinte, visage, code) ? À quoi sert-il côté paiement mobile ?",
    "fields": [
      {
        "id": "mech",
        "label": "Mécanisme observé (ou « aucun / non trouvé »)",
        "kind": "libre",
        "placeholder": "Mécanisme vu sur l’appareil…"
      },
      {
        "id": "role",
        "label": "Rôle dans un paiement NFC / wallet",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "Remplacer le POS et le commerçant"
          },
          {
            "id": "b",
            "label": "Générer le PAN en clair pour le commerçant"
          },
          {
            "id": "c",
            "label": "Authentifier le porteur sur l’appareil (CDCVM) avant / pendant le paiement"
          },
          {
            "id": "d",
            "label": "Faire le settlement vers la banque centrale"
          }
        ]
      }
    ],
    "correct": {
      "role": [
        "c"
      ]
    }
  },
  {
    "id": "j4-libre-wallet",
    "image": "img/evolution/evo-wallet.svg",
    "jour": "J4",
    "theme": "Wallets",
    "diff": "difficile",
    "charge": 4,
    "points": 2,
    "type": "libre",
    "prompt": "Distinguez « wallet carte tokenisée » (Apple/Google) et « wallet compte / mobile money ». Que stocke chacun, et pourquoi le tap EMV n’est pas le même sujet ?",
    "placeholder": "Votre réponse…",
    "ideeDirectrice": "Wallet carte tokenisée : credential / token device pour le tap EMV. Wallet compte / mobile money : solde ledger opérateur — pas le même objet que le tap carte tokenisée."
  },
  {
    "id": "j5-omni-def",
    "image": "img/evolution/evo-wallet.svg",
    "jour": "J5",
    "theme": "Omnicanal",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "L’omnicanal SI, c’est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Un backend / journal unique sous plusieurs canaux d’entrée"
      },
      {
        "id": "b",
        "label": "Avoir plusieurs moyens sans journal commun"
      },
      {
        "id": "c",
        "label": "Remplacer toute la chaîne monétique par une seule étape « omnicanal »"
      },
      {
        "id": "d",
        "label": "Uniquement une UX mobile jolie"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "j5-gateway",
    "image": "img/acteurs/acteur-psp.jpg",
    "jour": "J5",
    "theme": "Omnicanal",
    "diff": "faible",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "Le PSP, dans une architecture omnicanale, sert surtout de…",
    "choices": [
      {
        "id": "a",
        "label": "Secure Element du téléphone"
      },
      {
        "id": "b",
        "label": "Façade d’acceptation : normaliser et router les demandes de paiement"
      },
      {
        "id": "c",
        "label": "Émetteur du compte"
      },
      {
        "id": "d",
        "label": "Settlement final"
      }
    ],
    "correct": [
      "b"
    ]
  },
  {
    "id": "j5-normes-rappel",
    "image": "img/acteurs/acteur-psp.jpg",
    "jour": "J5",
    "theme": "Normes",
    "diff": "faible",
    "charge": 1,
    "points": 0.1,
    "type": "unique",
    "prompt": "Sur une plateforme omnicanale (QR + NFC + wallet), les normes ISO / EMV / token / PCI…",
    "choices": [
      {
        "id": "a",
        "label": "Ne concernent que le cash"
      },
      {
        "id": "b",
        "label": "Disparaissent dès qu’on a un PSP"
      },
      {
        "id": "c",
        "label": "Restent le socle (messaging, radio/EMV, token, PCI/SCA) : l’omnicanal orchestre, il ne remplace pas ces référentiels"
      },
      {
        "id": "d",
        "label": "Sont toutes remplacées par une seule norme « omnicanal ISO »"
      }
    ],
    "correct": [
      "c"
    ]
  },
  {
    "id": "act-qr-inconnu",
    "jour": "J2",
    "theme": "Action · téléphone",
    "diff": "moyen",
    "charge": 3,
    "points": 0.75,
    "type": "action",
    "actionKind": "scan-qr",
    "actionLabel": "Scannez ce QR (payload métier). Notez ce que propose — ou non — votre téléphone / apps.",
    "image": "img/qr/qr-paiement-demo.png",
    "imageCaption": "QR d’épreuve — scannez et observez (ne payez rien)",
    "prompt": "Comparez avec un QR « lien web » : même comportement ? Pourquoi une app métier peut être nécessaire ?",
    "fields": [
      {
        "id": "diff",
        "label": "Différence avec un QR URL ?",
        "kind": "unique",
        "choices": [
          {
            "id": "a",
            "label": "Ce QR ne peut être lu que par NFC"
          },
          {
            "id": "b",
            "label": "Aucun : tout QR ouvre toujours un site web"
          },
          {
            "id": "c",
            "label": "Ce QR configure uniquement le Wi‑Fi"
          },
          {
            "id": "d",
            "label": "Payload métier : il faut une app compatible pour l’interpréter — ce n’est pas forcément une URL"
          }
        ]
      },
      {
        "id": "obs",
        "label": "Ce que votre téléphone affiche / propose (ou « rien de clair »)",
        "kind": "libre",
        "placeholder": "Décrivez franchement…"
      }
    ],
    "correct": {
      "diff": [
        "d"
      ]
    }
  },
  {
    "id": "syn-forum",
    "image": "img/nfc/puce-nfc-vs-paiement.svg",
    "jour": "J4",
    "theme": "Normes",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.1,
    "type": "unique",
    "prompt": "NFC Forum vs ISO 14443 — formulation la plus juste ?",
    "choices": [
      {
        "id": "a",
        "label": "NFC Forum remplace EMVCo pour l’autorisation"
      },
      {
        "id": "b",
        "label": "14443 = settlement"
      },
      {
        "id": "c",
        "label": "Les deux sont synonymes stricts"
      },
      {
        "id": "d",
        "label": "14443 = tuyau radio ; NFC Forum = usages device/tags sur ce tuyau — pas l’AuthZ EMV"
      }
    ],
    "correct": [
      "d"
    ]
  },
  {
    "id": "syn-push",
    "image": "img/atelier/enrol-apple-pay.svg",
    "jour": "J4",
    "theme": "Wallets",
    "diff": "moyen",
    "charge": 1.5,
    "points": 0.15,
    "type": "unique",
    "prompt": "« Ajouter à Apple / Google Wallet » depuis l’app banque, c’est surtout…",
    "choices": [
      {
        "id": "a",
        "label": "Push provisioning : l’app banque initie l’enrolment ; le tap au POS passe ensuite par le wallet OEM"
      },
      {
        "id": "b",
        "label": "L’app banque répond elle-même au POS à chaque tap"
      },
      {
        "id": "c",
        "label": "Le settlement immédiat"
      },
      {
        "id": "d",
        "label": "Un paiement in-app marchand"
      }
    ],
    "correct": [
      "a"
    ]
  },
  {
    "id": "schema-acteurs",
    "image": "img/acteurs/acteur-porteur.jpg",
    "jour": "J1",
    "theme": "Schéma acteurs",
    "diff": "moyen",
    "charge": 2.5,
    "points": 0.75,
    "type": "schema",
    "prompt": "Schéma « qui fait quoi » sur une transaction carte. Placez chaque acteur dans le rôle indiqué sous la case.",
    "hint": "Une étiquette par rôle.",
    "schemaTitle": "Acteurs de la transaction carte",
    "schemaSubtitle": "Chaque case a déjà son rôle : choisissez l’acteur qui correspond.",
    "viewBox": "0 0 1000 300",
    "decor": [
      {
        "type": "note",
        "x": 500,
        "y": 270,
        "text": "Porteur / commerçant côté terrain · acquéreur / émetteur côté banques"
      }
    ],
    "slots": [
      {
        "id": "r1",
        "x": 40,
        "y": 80,
        "w": 210,
        "h": 90,
        "caption": "Paie avec la carte",
        "placeholder": "Acteur ?"
      },
      {
        "id": "r2",
        "x": 280,
        "y": 80,
        "w": 210,
        "h": 90,
        "caption": "Accepte le paiement en magasin",
        "placeholder": "Acteur ?"
      },
      {
        "id": "r3",
        "x": 520,
        "y": 80,
        "w": 210,
        "h": 90,
        "caption": "Banque du commerçant / acceptation",
        "placeholder": "Acteur ?"
      },
      {
        "id": "r4",
        "x": 760,
        "y": 80,
        "w": 210,
        "h": 90,
        "caption": "Banque du porteur · AuthZ compte",
        "placeholder": "Acteur ?"
      }
    ],
    "palette": [
      "Porteur",
      "Commerçant",
      "Acquéreur",
      "Émetteur"
    ],
    "correctSlots": {
      "r1": "Porteur",
      "r2": "Commerçant",
      "r3": "Acquéreur",
      "r4": "Émetteur"
    }
  },
  {
    "id": "schema-enrol",
    "jour": "J4",
    "theme": "Schéma enrolment wallet",
    "diff": "moyen",
    "charge": 3.5,
    "points": 0.75,
    "type": "schema",
    "prompt": "Cas « Ajouter à Apple / Google Wallet » depuis l’app banque (push provisioning) : l’app banque tire le wallet OEM pour lancer la demande. Placez les acteurs dans l’ordre du parcours, de gauche à droite. Ce n’est pas le tap au POS, ni un ajout lancé uniquement depuis le wallet.",
    "hint": "Glissez une étiquette par case.",
    "image": "img/atelier/enrol-apple-pay.svg",
    "schemaTitle": "Push provisioning · app banque → wallet OEM",
    "schemaSubtitle": "Enrolment initié depuis l’app banque (pas le paiement au POS).",
    "viewBox": "0 0 1000 300",
    "decor": [
      {
        "type": "arrow",
        "x1": 230,
        "y1": 130,
        "x2": 270,
        "y2": 130
      },
      {
        "type": "arrow",
        "x1": 470,
        "y1": 130,
        "x2": 510,
        "y2": 130
      },
      {
        "type": "arrow",
        "x1": 710,
        "y1": 130,
        "x2": 750,
        "y2": 130
      },
      {
        "type": "note",
        "x": 500,
        "y": 270,
        "text": "Après cet enrolment seulement, le tap au POS utilisera le wallet"
      }
    ],
    "slots": [
      {
        "id": "e1",
        "x": 30,
        "y": 70,
        "w": 190,
        "h": 110,
        "caption": "① Départ",
        "placeholder": "…"
      },
      {
        "id": "e2",
        "x": 280,
        "y": 70,
        "w": 180,
        "h": 110,
        "caption": "② Ensuite",
        "placeholder": "…"
      },
      {
        "id": "e3",
        "x": 520,
        "y": 70,
        "w": 180,
        "h": 110,
        "caption": "③ Puis",
        "placeholder": "…"
      },
      {
        "id": "e4",
        "x": 760,
        "y": 70,
        "w": 210,
        "h": 110,
        "caption": "④ Arrivée device",
        "placeholder": "…"
      }
    ],
    "palette": [
      "App banque",
      "Wallet OEM (Apple / Google)",
      "TSP",
      "Credential sur le device (SE ou HCE)"
    ],
    "correctSlots": {
      "e1": "App banque",
      "e2": "Wallet OEM (Apple / Google)",
      "e3": "TSP",
      "e4": "Credential sur le device (SE ou HCE)"
    }
  }
];
