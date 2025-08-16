#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-repo-snapshot}.zip"
zip -qr "$OUT" . -x ".git/*" "node_modules/*" "dist/*" "build/*"
echo "::notice::Snapshot at $OUT"
