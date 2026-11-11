#!/usr/bin/env bash
# Génère le polycopié A4 du Jour 1 :
#   1. assemble j1/support-etudiant.html depuis les blocs sources,
#   2. rend le PDF avec page « Sommaire » + numéros de page (make-support.py).
set -euo pipefail
cd "$(dirname "$0")/.."

TITLE="DSP2 & Open Banking · Jour 1"
SRC="j1/support-etudiant.html"
OUT="supports/J1-support-etudiant-dsp2-open-banking.pdf"

# 1. (Ré)assemblage du support à partir des blocs
if [ -f supports/assemble-j1-support.py ]; then
  python3 supports/assemble-j1-support.py
fi

# 2. Rendu PDF (sommaire + pagination)
python3 supports/make-support.py "$SRC" "$OUT" "$TITLE"

if [ -f "$OUT" ]; then
  echo "OK $OUT — $(du -h "$OUT" | cut -f1)"
  pdfinfo "$OUT" 2>/dev/null | grep -E "^Pages|^Page size"
else
  echo "ECHEC: pas de PDF" >&2; exit 1
fi
