#!/usr/bin/env bash
set -euo pipefail
# Requires: ImageMagick (convert)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/extension/icons"
mkdir -p "$OUT"
# Make clean brand squares w/ subtle corner text “BR”
make_icon() {
  local size="$1" color="$2" text="$3"
  convert -size ${size}x${size} xc:"$color" \
    -gravity southeast -pointsize $((size/6)) -fill white -annotate +6+4 "$text" \
    -gravity center \( -size ${size}x${size} xc:none \
      -fill "rgba(255,255,255,0.08)" -draw "roundrectangle 8,8,$((size-8)),$((size-8)),18,18" \) -compose over -composite \
    "$OUT/${size}.png"
}
# Use brand accent-2 by default
make_icon 16  "#0096FF" "BR"
make_icon 32  "#0096FF" "BR"
make_icon 48  "#0096FF" "BR"
make_icon 128 "#0096FF" "BR"
echo "Icons written to $OUT/"
