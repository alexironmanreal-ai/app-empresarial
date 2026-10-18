#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> fetch"
git fetch origin
echo "==> status"
git status -sb
echo "==> pull origin main"
git pull origin main || {
  echo "Conflictos. Opciones:"
  echo "  git stash -u && git pull origin main && git stash pop"
  echo "  git reset --hard origin/main"
  exit 1
}
echo "==> npm install"
npm install
echo "==> listo: npm run dev  |  npm run dist:linux"
