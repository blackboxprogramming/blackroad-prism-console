#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="/var/www/blackroad/apps/blackroad-firefox-chat"
mkdir -p "$DEST"
# 1) Ensure icons (requires ImageMagick)
bash "$ROOT/scripts/icons.sh" || echo "[warn] icons.sh failed; using whatever icons exist."
# 2) Firefox XPI
( cd "$ROOT/extension" && zip -r "$DEST/blackroad-chat.xpi" . -x '*.DS_Store' >/dev/null )
# 3) Chrome ZIP (swap manifest)
TMP="$(mktemp -d)"
rsync -a "$ROOT/extension/" "$TMP/"
cp "$TMP/manifest.chrome.json" "$TMP/manifest.json" 2>/dev/null || true
zip -r "$DEST/blackroad-chat.zip" -j \
  "$TMP/manifest.json" \
  "$TMP"/{popup.html,popup.css,popup.js,background.js,sw.js} \
  "$TMP"/icons/* >/dev/null
rm -rf "$TMP"
echo "Built:"
echo "  $DEST/blackroad-chat.xpi  (Firefox)"
echo "  $DEST/blackroad-chat.zip  (Chrome)"
