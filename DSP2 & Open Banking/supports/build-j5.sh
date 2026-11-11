#!/usr/bin/env bash
# Génère le polycopié A4 du Jour 1 depuis j5/support-etudiant.html
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="j5/support-etudiant.html"
OUT="supports/J5-support-etudiant-dsp2-open-banking.pdf"
ROOT="$(pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Copie avec chemins absolus + feuille d'impression injectée en dernier
python3 - "$SRC" "$TMP/print.html" "$ROOT" <<'PY'
import sys
src, dst, root = sys.argv[1:4]
s = open(src, encoding="utf-8").read()
s = s.replace('href="../css/',  'href="file://%s/css/'  % root)
s = s.replace('src="../js/',    'src="file://%s/js/'    % root)
s = s.replace('src="../img/',   'src="file://%s/img/'   % root)
# feuille A4 en dernier : elle doit gagner la cascade
s = s.replace('</head>', '<link rel="stylesheet" href="file://%s/css/support-a4.css" />\n</head>' % root)
open(dst, "w", encoding="utf-8").write(s)
PY

google-chrome \
  --headless=new --disable-gpu --no-sandbox \
  --no-pdf-header-footer \
  --print-to-pdf="$OUT" \
  --print-to-pdf-no-header \
  --virtual-time-budget=8000 \
  "file://$TMP/print.html" 2>/dev/null

if [ -f "$OUT" ]; then
  echo "OK $OUT — $(du -h "$OUT" | cut -f1)"
  pdfinfo "$OUT" 2>/dev/null | grep -E "^Pages|^Page size"
else
  echo "ECHEC: pas de PDF" >&2; exit 1
fi
