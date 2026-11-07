#!/usr/bin/env bash
cd "$(dirname "$0")"
echo
echo "=== Projet PDWN - Mini plateforme omnicanale ==="
echo
if ! command -v node >/dev/null 2>&1; then
  echo "[ERREUR] Node.js introuvable."
  exit 1
fi
if [[ ! -f server.js ]]; then
  echo "[ERREUR] server.js introuvable dans $(pwd)"
  exit 1
fi
exec node server.js
