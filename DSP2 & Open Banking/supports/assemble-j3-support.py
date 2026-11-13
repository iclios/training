#!/usr/bin/env python3
"""
Assemble j3/support-etudiant.html à partir des blocs sources du Jour 3,
EN SUPPRIMANT les notes formateur (<details class="trainer-notes">).

Contrairement au J1/J2, l'atelier du J3 (s4-atelier, « modélisation ») est
CONSERVÉ : c'est un exercice papier, pas un labo interactif.

Les <details> « cours » sont dépliés (attribut open).

Entrée : j3/<bloc>.html  (contenu extrait de <main> ... </main>)
Sortie : j3/support-etudiant.html
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
J3 = ROOT / "j3"

# (id, numéro, groupe nav, libellé sidebar)
BLOCS = [
    ("intro",          "01", "Ouverture",         "Introduction & objectifs"),
    ("s1-principe",    "02", "Parcours narratif", "S1 · Principe du paiement initié"),
    ("s2-flux",        "03", "Parcours narratif", "S2 · Flux PISP détaillé"),
    ("s3-architecture","04", "Parcours narratif", "S3 · Architecture SI PISP"),
    ("s4-applications","05", "Applications",      "S4 · Applications et cas concrets"),
]

TITLE_DAY = "Jour 3 : Le paiement initié"


def extract_main(path: pathlib.Path) -> str:
    """Contenu HTML entre <main> et </main>, sans bloc-pager ni notes
    formateur, avec tous les <details> dépliés."""
    html = path.read_text(encoding="utf-8")
    m = re.search(r"<main>(.*?)</main>", html, re.S)
    if not m:
        raise SystemExit(f"Impossible d'extraire <main> de {path}")
    body = m.group(1).rstrip()

    # bloc-pager (navigation inter-blocs, inutile sur papier)
    body = re.sub(r"<nav class=\"bloc-pager\"[^>]*>\s*</nav>", "", body)

    # notes formateur
    body = re.sub(
        r"<details class=\"trainer-notes\">.*?</details>",
        "",
        body,
        flags=re.S,
    )

    # déplier les <details> restants (encarts cours)
    body = re.sub(r"<details(\s)", r"<details open\1", body)
    body = re.sub(r"<details>", "<details open>", body)
    body = body.replace("<details open open", "<details open")

    return body


def build():
    parts = []
    for bloc_id, num, group, title in BLOCS:
        inner = extract_main(J3 / f"{bloc_id}.html")
        parts.append(
            f'<article class="support-bloc" id="{bloc_id}" data-num="{num}">\n'
            '  <section class="day-hero support-bloc-hero" style="padding-bottom:1.5rem">\n'
            '    <div class="wrap">\n'
            f'      <div class="fiche-meta"><span class="tag">{group}</span></div>\n'
            f'      <p class="day-kicker">{num} · {title}</p>\n'
            f'      <h1>{title}</h1>\n'
            '    </div>\n'
            '  </section>\n'
            '  <div class="wrap support-bloc-body">\n'
            f'{inner}\n'
            '  </div>\n'
            '</article>'
        )

    nav_items = "\n".join(
        f'          <a class="bloc-sidebar-item" href="#{bid}"><span class="bloc-sidebar-num">{num}</span><span class="bloc-sidebar-label">{title}</span></a>'
        for bid, num, group, title in BLOCS
    )

    head = '''<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Support étudiant — Jour 3 | DSP2 &amp; Open Banking</title>
    <link rel="stylesheet" href="../css/styles.css" />
    <link rel="stylesheet" href="../css/support-etudiant.css" />
    <link rel="stylesheet" href="../css/support-encarts.css" />
  </head>
  <body class="support-doc" data-bloc="support-etudiant">
    <header class="site-bar no-print">
      <div class="wrap site-bar-inner">
        <a class="brand-mark" href="../index.html"
          >DSP2 <span>&amp; Open Banking</span></a
        >
        <nav class="day-nav" aria-label="Jours du cours">
          <a class="day-nav-home" href="../index.html" title="Index principal">Accueil</a>
          <a href="../j1/intro.html">J1</a>
          <a href="../j2/intro.html">J2</a>
          <a class="is-active" href="intro.html">J3</a>
          <a href="../j4/intro.html">J4</a>
          <a href="../j5/intro.html">J5</a>
        </nav>
      </div>
    </header>

    <div class="support-print-bar no-print">
      <div class="wrap support-print-bar-inner">
        <a href="support.html">← Page Support</a>
        <button type="button" class="btn-print" onclick="window.print()">
          Imprimer / Enregistrer en PDF
        </button>
      </div>
    </div>

    <div class="fiche-shell support-shell">
      <aside class="bloc-sidebar no-print" aria-label="Sommaire du support">
        <p class="bloc-sidebar-title">Jour 3 · Support</p>
        <nav class="bloc-sidebar-nav">
'''

    title_page = '''
        </nav>
      </aside>

      <div class="fiche-main">
        <main>
          <section class="support-title-page">
            <div class="support-title-inner">
              <p class="support-title-kicker">Support étudiant</p>
              <h1>
                DSP2<br />
                et Open Banking
              </h1>
              <p class="support-title-day">
                Jour 3&nbsp;: Le paiement initié
              </p>
              <div class="support-title-author">
                <p class="support-title-name">Chrisvene MPANDZOU</p>
                <p class="support-title-email">chrisvene.mpandzou@a2mtech.com</p>
                <p class="support-title-promo">M2 SIB&nbsp;·&nbsp;2026 – 2027</p>
              </div>
            </div>
          </section>

'''

    tail = '''

        </main>
      </div>
    </div>

    <footer class="site-foot no-print">
      <div class="wrap">
        <a href="index.html">Sommaire Jour 3</a> · Support étudiant
      </div>
    </footer>
  </body>
</html>
'''

    doc = head + nav_items + title_page + "\n".join(parts) + tail
    out = J3 / "support-etudiant.html"
    out.write_text(doc, encoding="utf-8")
    print(f"OK {out.relative_to(ROOT)} — {len(doc)} octets, {len(BLOCS)} blocs")


if __name__ == "__main__":
    build()
