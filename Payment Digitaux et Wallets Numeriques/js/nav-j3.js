window.J3_BLOCS = [
  { id: "intro", title: "Intro & objectifs", href: "intro.html" },
  { id: "definition", title: "Définition & objectifs", href: "definition.html" },
  { id: "lifecycle", title: "Network tokenization & lifecycle", href: "lifecycle.html" },
  { id: "architecture-si", title: "Architecture SI tokenisation", href: "architecture-si.html" },
  { id: "securite-conformite", title: "Sécurité & conformité", href: "securite-conformite.html" },
  { id: "atelier", title: "Atelier palpable", href: "atelier.html" },
];

(function initJ3Nav() {
  const currentId = document.body.dataset.bloc;
  if (!currentId) return;
  const blocs = window.J3_BLOCS;
  const currentIndex = blocs.findIndex((b) => b.id === currentId);
  const sidebar = document.getElementById("bloc-sidebar");
  if (sidebar) {
    const heading = document.createElement("p");
    heading.className = "bloc-sidebar-title";
    heading.textContent = "Jour 3";
    const list = document.createElement("nav");
    list.className = "bloc-sidebar-nav";
    list.setAttribute("aria-label", "Blocs du jour 3");
    blocs.forEach((bloc, i) => {
      const el = document.createElement(bloc.href ? "a" : "span");
      el.className = "bloc-sidebar-item";
      if (!bloc.href) el.classList.add("is-disabled");
      if (bloc.id === currentId) el.classList.add("is-current");
      if (bloc.href) el.href = bloc.href;
      const num = document.createElement("span");
      num.className = "bloc-sidebar-num";
      num.textContent = String(i + 1).padStart(2, "0");
      const label = document.createElement("span");
      label.className = "bloc-sidebar-label";
      label.textContent = bloc.title;
      el.append(num, label);
      list.appendChild(el);
    });
    sidebar.append(heading, list);
  }
  const pager = document.querySelector(".bloc-pager");
  if (pager && currentIndex >= 0) {
    const prevBloc = currentIndex > 0 ? blocs[currentIndex - 1] : null;
    const nextBloc = currentIndex < blocs.length - 1 ? blocs[currentIndex + 1] : null;
    pager.innerHTML = "";
    const prevLink = document.createElement("a");
    if (prevBloc?.href) prevLink.href = prevBloc.href; else { prevLink.href = "#"; prevLink.classList.add("is-disabled"); }
    prevLink.innerHTML = `<span class="dir">Précédent</span><span class="title">${prevBloc ? prevBloc.title : "—"}</span>`;
    pager.appendChild(prevLink);
    const nextLink = document.createElement("a");
    nextLink.className = "next";
    if (nextBloc?.href) nextLink.href = nextBloc.href; else { nextLink.href = "#"; nextLink.classList.add("is-disabled"); }
    nextLink.innerHTML = `<span class="dir">Suivant</span><span class="title">${nextBloc ? nextBloc.title : "—"}</span>`;
    pager.appendChild(nextLink);
  }
  const blockMap = document.getElementById("block-map");
  if (blockMap) {
    blockMap.innerHTML = "";
    blocs.forEach((bloc) => {
      const a = document.createElement("a");
      a.href = bloc.href || "#";
      if (!bloc.href) a.classList.add("is-disabled");
      a.innerHTML = `<span class="bm-title">${bloc.title}</span><span class="bm-status">${bloc.href ? "Prêt" : "À venir"}</span>`;
      blockMap.appendChild(a);
    });
  }
})();
