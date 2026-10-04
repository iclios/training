window.J3_NAV = [
  { type: "item", id: "intro", title: "Intro & objectifs", href: "intro.html" },
  { type: "item", id: "definition", title: "Définition", href: "definition.html" },
  { type: "item", id: "objectifs", title: "Objectifs de la tokenisation", href: "objectifs.html" },
  { type: "item", id: "domaines", title: "Domaines d’usage", href: "domaines.html" },
  {
    type: "item",
    id: "lifecycle",
    title: "Network tokenization & lifecycle",
    href: "lifecycle.html",
    children: [
      { id: "provisioning", title: "Provisioning", href: "lifecycle.html#provisioning" },
      { id: "stockage", title: "Stockage", href: "lifecycle.html#stockage" },
      { id: "auth", title: "Auth · token / PAN", href: "lifecycle.html#auth" },
      { id: "gouvernance", title: "Gouvernance", href: "lifecycle.html#gouvernance" },
      { id: "cryptogrammes", title: "Cryptogrammes", href: "lifecycle.html#cryptogrammes" },
    ],
  },
  {
    type: "item",
    id: "architecture-si",
    title: "Architecture SI tokenisation",
    href: "architecture-si.html",
  },
  {
    type: "item",
    id: "securite-conformite",
    title: "Sécurité & conformité",
    href: "securite-conformite.html",
  },
  { type: "item", id: "atelier", title: "Atelier", href: "atelier.html" },
  { type: "item", id: "support", title: "Support", href: "support.html" },
];

/** Pages pour pager / sommaire (sans groupes ni ancres) */
window.J3_BLOCS = window.J3_NAV.filter((n) => n.type === "item");

(function initJ3Nav() {
  const currentId = document.body.dataset.bloc;
  if (!currentId) return;

  const blocs = window.J3_BLOCS;
  const currentIndex = blocs.findIndex((b) => b.id === currentId);
  const hash = (location.hash || "").replace(/^#/, "");

  const sidebar = document.getElementById("bloc-sidebar");
  if (sidebar) {
    const heading = document.createElement("p");
    heading.className = "bloc-sidebar-title";
    heading.textContent = "Jour 3";

    const list = document.createElement("nav");
    list.className = "bloc-sidebar-nav";
    list.setAttribute("aria-label", "Blocs du jour 3");

    let pageNum = 0;

    window.J3_NAV.forEach((node) => {
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
      if (node.id === currentId && !hash) el.classList.add("is-current");
      if (node.id === currentId && hash) el.classList.add("is-section-active");
      if (node.href) el.href = node.href;

      const num = document.createElement("span");
      num.className = "bloc-sidebar-num";
      num.textContent = String(pageNum).padStart(2, "0");

      const label = document.createElement("span");
      label.className = "bloc-sidebar-label";
      label.textContent = node.title;

      el.append(num, label);
      list.appendChild(el);

      if (node.children && node.children.length) {
        const sub = document.createElement("div");
        sub.className = "bloc-sidebar-sub";
        if (node.id === currentId) sub.classList.add("is-open");

        node.children.forEach((child) => {
          const a = document.createElement("a");
          a.className = "bloc-sidebar-subitem";
          a.href = child.href;
          if (node.id === currentId && hash === child.id) {
            a.classList.add("is-current");
          }
          a.textContent = child.title;
          a.dataset.anchor = child.id;
          sub.appendChild(a);
        });

        list.appendChild(sub);
      }
    });

    sidebar.append(heading, list);

    if (currentId === "lifecycle") {
      const anchors = [
        "provisioning",
        "stockage",
        "auth",
        "gouvernance",
        "cryptogrammes",
      ];
      const subLinks = [...list.querySelectorAll(".bloc-sidebar-subitem")];
      const parentLink = list.querySelector(
        '.bloc-sidebar-item[href="lifecycle.html"]'
      );

      function setActiveAnchor(id) {
        subLinks.forEach((a) => {
          a.classList.toggle("is-current", a.dataset.anchor === id);
        });
        if (parentLink) {
          parentLink.classList.toggle("is-current", !id);
          parentLink.classList.toggle("is-section-active", Boolean(id));
        }
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible?.target?.id) setActiveAnchor(visible.target.id);
        },
        { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] }
      );

      anchors.forEach((id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });

      if (hash) setActiveAnchor(hash);
    }
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
