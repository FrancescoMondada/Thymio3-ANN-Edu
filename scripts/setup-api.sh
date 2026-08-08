#!/usr/bin/env bash
# Clones and builds the Thymio 3 TypeScript API into vendor/, producing
# vendor/thymio3-ts-api/dist/thymio.mjs which vite.config.js aliases.
set -euo pipefail

REPO="https://github.com/Mobsya/thymio3-ts-api.git"
VENDOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/vendor"
API_DIR="$VENDOR_DIR/thymio3-ts-api"

mkdir -p "$VENDOR_DIR"

if [ -d "$API_DIR/.git" ]; then
  echo "==> Updating existing clone in $API_DIR"
  git -C "$API_DIR" pull --ff-only
else
  # A leftover directory without git metadata would make `git clone` refuse to
  # write into it, so replace it with a fresh clone.
  rm -rf "$API_DIR"
  echo "==> Cloning $REPO"
  git clone --depth 1 "$REPO" "$API_DIR"
fi

echo "==> Installing API dependencies"
npm install --prefix "$API_DIR"

echo "==> Building API"
npm run build --prefix "$API_DIR"

echo "==> Done: $API_DIR/dist/thymio.mjs"
