/**
 * Carte cliquable « Où la DSP2 s'applique-t-elle ? ».
 *
 * Chaque zone de la carte SVG porte un attribut data-zone="xxx".
 * Cliquer sur une zone ouvre l'accordéon correspondant
 * (un élément <details> portant data-zone-panel="xxx") et ferme
 * les autres. Un second clic sur la même zone referme l'accordéon.
 *
 * Usage :
 *   <div class="map-dsp2">
 *     <svg> ... <g data-zone="ue"> ... </g> ... </svg>
 *   </div>
 *   <div class="map-accordeon">
 *     <details data-zone-panel="ue"> ... </details>
 *   </div>
 */
(function initCarteDsp2() {
  if (window.__carteDsp2Ready) return;
  window.__carteDsp2Ready = true;

  const maps = document.querySelectorAll(".map-dsp2");
  if (!maps.length) return;

  maps.forEach((map) => {
    const svg = map.querySelector("svg");
    if (!svg) return;

    // L'accordéon est cherché dans le même conteneur logique :
    // d'abord un frère direct, sinon dans le document.
    let acc = map.nextElementSibling;
    while (acc && !acc.classList.contains("map-accordeon")) {
      acc = acc.nextElementSibling;
    }
    if (!acc) acc = document.querySelector(".map-accordeon");
    if (!acc) return;

    const zones = Array.from(svg.querySelectorAll("[data-zone]"));
    const panels = Array.from(acc.querySelectorAll("[data-zone-panel]"));
    if (!zones.length || !panels.length) return;

    function activate(id) {
      const current = panels.find((p) => p.open);
      const reclick = current && current.getAttribute("data-zone-panel") === id;

      // Ferme tous les panneaux.
      panels.forEach((p) => {
        p.open = false;
      });

      // Si on reclique sur le panneau déjà ouvert → on referme tout.
      if (reclick) {
        zones.forEach((z) => {
          z.classList.remove("is-active");
          z.setAttribute("aria-expanded", "false");
        });
        return;
      }

      // Ouvre le panneau correspondant + surbrillance sur la carte.
      panels.forEach((p) => {
        const on = p.getAttribute("data-zone-panel") === id;
        p.open = on;
      });
      zones.forEach((z) => {
        const on = z.getAttribute("data-zone") === id;
        z.classList.toggle("is-active", on);
        z.setAttribute("aria-expanded", on ? "true" : "false");
      });

      const target = panels.find(
        (p) => p.getAttribute("data-zone-panel") === id
      );
      if (target) {
        const rect = target.getBoundingClientRect();
        // Amène l'accordéon à l'écran si besoin (sans sauter brutalement).
        const outOfView = rect.top < 0 || rect.bottom > window.innerHeight;
        if (outOfView) {
          target.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }

    zones.forEach((z) => {
      const id = z.getAttribute("data-zone");
      z.setAttribute("role", "button");
      z.setAttribute("tabindex", "0");
      z.setAttribute("aria-expanded", "false");

      z.addEventListener("click", () => activate(id));
      z.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(id);
        }
      });
    });

    // Si l'utilisateur ferme/ouvre un panneau directement, on resynchronise
    // la surbrillance de la carte.
    panels.forEach((p) => {
      p.addEventListener("toggle", () => {
        if (!p.open) {
          const id = p.getAttribute("data-zone-panel");
          const z = zones.find((el) => el.getAttribute("data-zone") === id);
          if (z) {
            z.classList.remove("is-active");
            z.setAttribute("aria-expanded", "false");
          }
        }
      });
    });
  });
})();
