window.OB_BLOCS = [
  { id: "intro", title: "Intro & objectifs", href: "intro.html", group: "Ouverture" },
  // Parcours Jour 4
  { id: "s1-principe", title: "S1 · Principe de l’agrégation", href: "s1-principe.html", group: "Parcours" },
  { id: "s2-flux", title: "S2 · Flux AIS & consentement", href: "s2-flux.html", group: "Parcours" },
  { id: "s3-architecture", title: "S3 · Architecture SI AISP", href: "s3-architecture.html", group: "Parcours" },
  { id: "s4-securite", title: "S4 · Sécurité & gouvernance", href: "s4-securite.html", group: "Parcours" },
  { id: "support", title: "Support étudiant", href: "support.html", group: "Parcours narratif" },
];

(function initObNav() {
  const currentId = document.body.dataset.bloc;
  const blocs = window.OB_BLOCS || [];
  const currentIndex = blocs.findIndex((b) => b.id === currentId);

  const sidebar = document.getElementById("bloc-sidebar");
  if (sidebar) {
    const heading = document.createElement("p");
    heading.className = "bloc-sidebar-title";
    heading.textContent = "Jour 4 · Agrégation AISP";

    const list = document.createElement("nav");
    list.className = "bloc-sidebar-nav";
    list.setAttribute("aria-label", "Blocs du jour 4");

    let lastGroup = null;
    blocs.forEach((bloc, i) => {
      if (bloc.group && bloc.group !== lastGroup) {
        const g = document.createElement("div");
        g.className = "bloc-sidebar-group";
        g.textContent = bloc.group;
        list.appendChild(g);
        lastGroup = bloc.group;
      }
      const el = document.createElement(bloc.href ? "a" : "span");
      el.className = "bloc-sidebar-item";
      if (!bloc.href) el.classList.add("is-disabled");
      if (bloc.id === currentId) el.classList.add("is-current");
      if (bloc.href) el.href = bloc.href;

      const num = document.createElement("span");
      num.className = "bloc-sidebar-num";
      num.textContent = String(i).padStart(2, "0");

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
    const nextBloc =
      currentIndex < blocs.length - 1 ? blocs[currentIndex + 1] : null;

    pager.innerHTML = "";

    const prevLink = document.createElement("a");
    prevLink.href = prevBloc?.href || "#";
    if (!prevBloc?.href) prevLink.classList.add("is-disabled");
    prevLink.innerHTML = `<span class="dir">Précédent</span><span class="title">${
      prevBloc ? prevBloc.title : "—"
    }</span>`;
    pager.appendChild(prevLink);

    const nextLink = document.createElement("a");
    nextLink.className = "next";
    nextLink.href = nextBloc?.href || "#";
    if (!nextBloc?.href) nextLink.classList.add("is-disabled");
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

