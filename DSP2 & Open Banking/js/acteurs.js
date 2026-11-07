/**
 * Blocs acteurs cliquables — affiche le détail (liste à puces) sous le schéma.
 * Usage :
 *   <svg> ... <g class="acteur" tabindex="0" role="button" data-acteur="commission"> ... </g> ...
 *   </svg>
 *   <div class="acteur-detail" data-acteur-panel="commission"> <ul>...</ul> </div>
 */
(function initActeurs() {
  if (window.__acteursReady) return;
  window.__acteursReady = true;

  const figures = document.querySelectorAll("figure.fig-acteurs");
  if (!figures.length) return;

  figures.forEach((figure) => {
    const svg = figure.querySelector("svg");
    if (!svg) return;

    const groups = Array.from(svg.querySelectorAll("[data-acteur]"));
    const panels = Array.from(figure.querySelectorAll("[data-acteur-panel]"));
    if (!groups.length) return;

    function activate(id) {
      groups.forEach((g) => {
        const on = g.getAttribute("data-acteur") === id;
        g.classList.toggle("is-active", on);
        g.classList.toggle("is-dim", !on);
        g.setAttribute("aria-pressed", on ? "true" : "false");
      });

      panels.forEach((p) => {
        const on = p.getAttribute("data-acteur-panel") === id;
        p.hidden = !on;
        p.classList.toggle("is-active", on);
      });
    }

    groups.forEach((g) => {
      const id = g.getAttribute("data-acteur");
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      g.setAttribute("aria-pressed", "false");
      g.style.cursor = "pointer";

      g.addEventListener("click", () => activate(id));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(id);
        }
      });
    });

    // Panneaux repliés au départ
    panels.forEach((p) => {
      p.hidden = true;
    });
  });
})();
