window.J4_NAV = [
  { type: "item", id: "intro", title: "Intro & objectifs", href: "intro.html" },
  { type: "item", id: "technologie-nfc", title: "Technologie NFC", href: "technologie-nfc.html" },
  {
    type: "item",
    id: "paiement-contactless",
    title: "Paiement sans contact EMV",
    href: "paiement-contactless.html",
  },
  {
    type: "item",
    id: "architecture-wallets",
    title: "Architecture NFC mobile & wallets",
    href: "architecture-wallets.html",
  },
  { type: "item", id: "apple-pay", title: "Apple Pay", href: "apple-pay.html" },
  { type: "item", id: "google-pay", title: "Google Pay", href: "google-pay.html" },
  {
    type: "item",
    id: "cas-pratique",
    title: "Cas pratique smartphone → POS",
    href: "cas-pratique.html",
  },
  { type: "item", id: "atelier", title: "Atelier", href: "atelier.html" },
  { type: "item", id: "support", title: "Support", href: "support.html" },
];

/** Pages pour pager / sommaire (sans groupes ni ancres) */
window.J4_BLOCS = window.J4_NAV.filter((n) => n.type === "item");

(function initJ4Nav() {
  const currentId = document.body.dataset.bloc;
  if (!currentId) return;

  const blocs = window.J4_BLOCS;
  const currentIndex = blocs.findIndex((b) => b.id === currentId);

  const sidebar = document.getElementById("bloc-sidebar");
  if (sidebar) {
    const heading = document.createElement("p");
    heading.className = "bloc-sidebar-title";
    heading.textContent = "Jour 4";

    const list = document.createElement("nav");
    list.className = "bloc-sidebar-nav";
    list.setAttribute("aria-label", "Blocs du jour 4");

    let pageNum = 0;

    window.J4_NAV.forEach((node) => {
      if (node.type === "group") {
        const g = document.createElement("p");
        g.className = "bloc-sidebar-group";
        g.textContent = node.label;
        list.appendChild(g);
        return;
      }

      pageNum += 1;
      const el = document.createElement(node.href ? "a" : "span");
      el.className = "bloc-sidebar-item";
      if (!node.href) el.classList.add("is-disabled");
      if (node.id === currentId) el.classList.add("is-current");
      if (node.href) el.href = node.href;

      const num = document.createElement("span");
      num.className = "bloc-sidebar-num";
      num.textContent = String(pageNum).padStart(2, "0");

      const label = document.createElement("span");
      label.className = "bloc-sidebar-label";
      label.textContent = node.title;

      el.append(num, label);
      list.appendChild(el);
    });

    sidebar.append(heading, list);
  }

  const pager = document.querySelector(".bloc-pager");
  if (pager && currentIndex >= 0) {
    const prevBloc = currentIndex > 0 ? blocs[currentIndex - 1] : null;
    const nextBloc =
      currentIndex < blocs.length - 1 ? blocs[currentIndex + 1] : null;
    pager.innerHTML = "";

    const prevLink = document.createElement("a");
    if (prevBloc?.href) prevLink.href = prevBloc.href;
    else {
      prevLink.href = "#";
      prevLink.classList.add("is-disabled");
    }
    prevLink.innerHTML = `<span class="dir">Précédent</span><span class="title">${
      prevBloc ? prevBloc.title : "—"
    }</span>`;
    pager.appendChild(prevLink);

    const nextLink = document.createElement("a");
    nextLink.className = "next";
    if (nextBloc?.href) nextLink.href = nextBloc.href;
    else {
      nextLink.href = "#";
      nextLink.classList.add("is-disabled");
    }
    nextLink.innerHTML = `<span class="dir">Suivant</span><span class="title">${
      nextBloc ? nextBloc.title : "—"
    }</span>`;
    pager.appendChild(nextLink);
  }

  const blockMap = document.getElementById("block-map");
  if (blockMap) {
    blockMap.innerHTML = "";
    blocs.forEach((bloc) => {
      const a = document.createElement("a");
      a.href = bloc.href || "#";
      if (!bloc.href) a.classList.add("is-disabled");
      a.innerHTML = `<span class="bm-title">${bloc.title}</span><span class="bm-status">${
        bloc.href ? "Prêt" : "À venir"
      }</span>`;
      blockMap.appendChild(a);
    });
  }
})();

(function loadPresentMode() {
  if (document.querySelector("script[data-present-js]")) return;
  var src = "../js/present.js";
  var link = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
  if (link && link.href) {
    src = link.href.replace(/css\/styles\.css[^/]*$/i, "js/present.js");
  } else {
    var here = document.currentScript && document.currentScript.src;
    if (here) src = new URL("present.js", here).href;
  }
  var s = document.createElement("script");
  s.src = src;
  s.dataset.presentJs = "1";
  (document.body || document.documentElement).appendChild(s);
})();
