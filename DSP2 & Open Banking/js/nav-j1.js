window.OB_BLOCS = [
  { id: "intro", title: "Intro & objectifs", href: "intro.html", group: "Ouverture" },
  // Cadre réglementaire
  { id: "modele-ferme", title: "Le modèle bancaire fermé", href: "modele-ferme.html", group: "Cadre réglementaire" },
  { id: "dsp1", title: "DSP1 · D’où l’on vient", href: "dsp1.html", group: "Cadre réglementaire" },
  { id: "cadre", title: "La DSP2 en fiche", href: "cadre.html", group: "Cadre réglementaire" },
  { id: "autorites", title: "Les autorités européennes", href: "autorites.html", group: "Cadre réglementaire" },
  { id: "directives-monde", title: "L’Open Banking hors d’Europe", href: "directives-monde.html", group: "Cadre réglementaire" },
  // Parcours narratif (principal)
  { id: "s1-probleme", title: "S1 · Le problème", href: "s1-probleme.html", group: "Parcours narratif" },
  { id: "atelier-scraping", title: "Atelier · Screen scraping", href: "atelier-scraping.html", group: "Parcours narratif" },
  { id: "s2-reponse", title: "S2 · La réponse", href: "s2-reponse.html", group: "Parcours narratif" },
  { id: "atelier-api", title: "Atelier · De l’API au consentement", href: "atelier-api.html", group: "Parcours narratif" },
  { id: "s3-machine", title: "S3 · La machine", href: "s3-machine.html", group: "Parcours narratif" },
  { id: "s4-atelier", title: "S4 · Petit projet à restituer", href: "s4-atelier.html", group: "Parcours narratif" },
  // Annexes
  { id: "annexe", title: "Annexe · Concepts et statuts", href: "annexe.html", group: "Annexes" },
  { id: "support", title: "Support étudiant", href: "support.html", group: "Annexes" },
];

(function initObNav() {
  const currentId = document.body.dataset.bloc;
  const blocs = window.OB_BLOCS || [];
  const currentIndex = blocs.findIndex((b) => b.id === currentId);

  const sidebar = document.getElementById("bloc-sidebar");
  if (sidebar) {
    const heading = document.createElement("p");
    heading.className = "bloc-sidebar-title";
    heading.textContent = "Jour 1 · DSP2 & Open Banking";

    const list = document.createElement("nav");
    list.className = "bloc-sidebar-nav";
    list.setAttribute("aria-label", "Blocs du jour 1");

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
      if (bloc.soon) {
        el.classList.add("is-soon");
        el.title = "Section à venir";
      }
      if (bloc.id === currentId) el.classList.add("is-current");
      if (bloc.href) el.href = bloc.href;

      const num = document.createElement("span");
      num.className = "bloc-sidebar-num";
      num.textContent = String(i).padStart(2, "0");

      const label = document.createElement("span");
      label.className = "bloc-sidebar-label";
      label.textContent = bloc.title;
      if (bloc.soon) {
        const tag = document.createElement("span");
        tag.className = "bloc-soon-tag";
        tag.textContent = "à venir";
        label.append(" ", tag);
      }

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
