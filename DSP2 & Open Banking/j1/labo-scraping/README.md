# Labo — Connexion classique vs Screen scraping

Labo interactif du **Jour 1** du cours *DSP2 & Open Banking*.
Deux scénarios et une manipulation de plus (simuler une refonte) à faire
directement dans le navigateur.

## Contexte

Lyam a un compte chez **Banque Est**. Il veut utiliser **MonBuddy**, une
application de budget qui doit lire ses opérations.

- **Scénario 1 — Connexion classique** : Lyam se connecte lui-même au site de
  sa banque (identifiant + mot de passe).
- **Scénario 2 — Screen scraping** : MonBuddy n'a aucune API. Elle rejoue les
  identifiants de Lyam sur la page de la banque, ouvre la session et lit le
  tableau HTML pour en extraire les opérations — exactement ce que décrit la
  séquence S1.
- **Manipulation bonus — Refonte** : la banque change son HTML, et le robot
  casse. C'est le cœur de l'atelier.

---

## Comment lancer (aucune installation)

Ce labo est **100 % autonome** : pas de serveur, pas de dépendance, pas
d'internet requis.

1. Téléchargez (ou décompressez) le dossier `labo/`.
2. Double-cliquez sur **`index.html`**.
3. Le labo s'ouvre dans votre navigateur (Chrome, Firefox, Edge, Safari).

> Astuce : si votre navigateur bloque quelque chose, ouvrez une fenêtre et
> glissez-déposez `index.html` dedans. La page fonctionne aussi bien en
> `file://` qu'en ligne, car tout est côté client (JS pur).

### Identifiants de démonstration

| Champ        | Valeur       |
|--------------|--------------|
| Identifiant  | `lyam.demo`  |
| Mot de passe | `soleilmars` |

---

## Toutes les manipulations, une par une

Voici **tout ce que vous pouvez faire** dans le labo, classé par onglet.
Chaque action indique ce qu'il faut observer.

### Onglet 1 — Connexion classique

**Action 1.1 — Se connecter comme Lyam**

1. Restez sur l'onglet **1 · Connexion classique** (affiché par défaut).
2. Les champs sont déjà pré-remplis (`lyam.demo` / `soleilmars`). Cliquez sur
   **« Se connecter »**.

À observer :
- Le formulaire disparaît, le **tableau de bord** apparaît (solde + relevé).
- Le **journal d'étapes** indique : authentification réussie, session ouverte
  au nom de Lyam — la banque sait que c'est lui.

**Action 1.2 — Se déconnecter**

- Cliquez sur **« Se déconnecter »** dans le tableau de bord.

À observer : retour au formulaire, le journal note que la session est fermée
et que rien n'a été stocké.

> **Ce que ça montre** : la connexion classique est *directe* et sûre — mais
> Lyam doit la refaire **banque par banque**. Aucun moyen de tout voir au même
> endroit.

### Onglet 2 — Screen scraping

Cliquez sur l'onglet **2 · Screen scraping**.

**Action 2.1 — Lancer la synchronisation MonBuddy**

1. Cliquez sur **« Lancer la "synchro" MonBuddy »**.
2. Regardez les deux colonnes : à gauche la banque, à droite MonBuddy.

À observer, dans l'ordre (et dans le journal) :
1. MonBuddy **remplit le formulaire** de la banque à la place de Lyam (saisie
   animée, caractère par caractère).
2. Le panneau rouge **« ⚠ Identifiants stockés par MonBuddy »** apparaît : le
   mot de passe est gardé **en clair** (`soleilmars`).
3. MonBuddy **ouvre la session** — la banque ne voit pas la différence.
4. MonBuddy **lit réellement les `<td>` du tableau HTML** et affiche les
   **4 opérations** extraites (avec ▲ crédit / ▼ débit).

**Action 2.2 — Réinitialiser**

- Cliquez sur **« Réinitialiser »**.

À observer : formulaire vidé, tableau de bord masqué, panneau des identifiants
caché, journal remis à zéro. **Tout est prêt à rejouer.**

**Action 2.3 — Simuler une refonte du site banque (LE moment clé)**

> ⚠️ Ce bouton n'est activable **qu'après une synchro réussie** (Action 2.1).
> C'est voulu : on voit d'abord le robot marcher, ensuite on le casse.

1. Après une synchro réussie, cliquez sur **« Simuler une refonte du site
   banque »** (bouton orange).
2. Un **bandeau d'explication** apparaît : les classes `td.date` /
   `td.libelle` / `td.montant` deviennent `td.tx-when` / `td.tx-what` /
   `td.tx-amount`.
3. **Relancez la synchro** (même bouton qu'à l'Action 2.1).

À observer :
- Le relevé a **changé de structure** (les classes CSS ne sont plus les mêmes).
- Le robot cherche encore `td.date` / `td.libelle` / `td.montant` : il **ne
  trouve plus rien**.
- La zone « Données extraites » affiche **0 opération**.
- Le journal explique la casse : *donnée absente* (ou pire, *donnée fausse*),
  et le coût de tout réécrire.

**Action 2.4 — Revenir à l'état d'origine**

- Cliquez sur **« Réinitialiser »**.

À observer : le HTML d'origine est **restauré** (sauvegarde automatique du
`tbody`). Vous pouvez relancer la synchro, elle remarche, puis rejouer la
refonte autant de fois que voulu.

> **Ce que ça montre** : le scraping dépend entièrement du **balisage** de la
> page. Une refonte, un champ déplacé, une classe renommée — et le robot rend
> des données fausses ou vides, **sans alerte**.

### Navigation entre les onglets

- **Clic** sur un onglet pour basculer.
- **Flèches ← / →** au clavier pour passer d'un onglet à l'autre (accessibilité).

---

## Récapitulatif des manipulations

| Activité                                        | Type        | Où                        |
|-------------------------------------------------|-------------|---------------------------|
| Connexion classique                             | Manipulation| 🔧 Labo — onglet 1        |
| Synchro MonBuddy (formulaire, session)          | Manipulation| 🔧 Labo — onglet 2        |
| Identifiants en clair                           | Observation | 🔧 Labo — onglet 2        |
| Extraction du DOM (4 opérations)                | Observation | 🔧 Labo — onglet 2        |
| **Simuler une refonte → casse**                 | Manipulation| 🔧 Labo — onglet 2        |

---

## Pistes de réflexion (pour l'atelier)

1. Pourquoi MonBuddy a-t-elle besoin de **stocker** les identifiants ? (voir le
   panneau rouge)
2. Après l'Action 2.3, **pourquoi** la synchro ne renvoie plus rien ? Quelles
   classes le robot cherchait-il, quelles classes trouve-t-il maintenant ?
3. Pourquoi une **donnée fausse** est-elle plus dangereuse qu'une **donnée
   absente** pour le budget de Lyam ?
4. Si le compte de Lyam est vidé, **qui** est responsable : Lyam, MonBuddy, ou
   la banque ?
5. Que faudrait-il pour que MonBuddy n'ait **plus besoin** des identifiants ?
   (→ c'est la réponse de la DSP2, vue en S2)

---

## Fichiers

```
labo/
  index.html   → la page (point d'entrée, double-clic)
  labo.css     → le style
  labo.js      → toute la logique (onglets, synchro, refonte)
  README.md    → ce fichier
```

---

## Notes techniques

- **Aucune requête réseau** : la « banque » et l'« application » sont simulées
  dans la même page.
- **Aucun serveur** : le JS lit réellement le DOM de la page banque
  (`document.querySelectorAll`, `textContent`, `classList`), ce qui illustre
  le principe du scraping.
- **Simulation de refonte** : le script sauvegarde le `tbody` d'origine, puis
  le remplace par une structure `td.tx-*`. Le bouton « Réinitialiser » restaure
  la sauvegarde. Aucune page n'est rechargée.
- **Données fictives uniquement.** Aucun identifiant réel, aucun compte réel.
