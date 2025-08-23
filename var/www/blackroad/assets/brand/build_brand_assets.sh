#!/usr/bin/env bash
# FILE: /var/www/blackroad/assets/brand/build_brand_assets.sh

set -euo pipefail
cd "$(dirname "$0")"

mkdir -p icons

# Prefer ImageMagick 7 ('magick'), fallback to 'convert', then rsvg/inkscape.
if command -v magick >/dev/null 2>&1; then
  IM="magick"
elif command -v convert >/dev/null 2>&1; then
  IM="convert"
else
  IM=""
fi

sizes=(16 32 48 64 96 128 180 192 256 384 512)

if [[ -n "${IM}" ]]; then
  for s in "${sizes[@]}"; do
    "${IM}" -background none logo.svg -resize "${s}x${s}" "icons/icon-${s}.png"
  done

  # favicon.ico (multi-size)
  if [[ "${IM}" == "magick" ]]; then
    magick "icons/icon-16.png" "icons/icon-32.png" "icons/icon-48.png" favicon.ico
  else
    convert "icons/icon-16.png" "icons/icon-32.png" "icons/icon-48.png" favicon.ico
  fi
else
  if command -v rsvg-convert >/dev/null 2>&1; then
    for s in "${sizes[@]}"; do
      rsvg-convert -w "${s}" -h "${s}" -o "icons/icon-${s}.png" logo.svg
    done
  elif command -v inkscape >/dev/null 2>&1; then
    for s in "${sizes[@]}"; do
      inkscape logo.svg --export-type=png --export-filename="icons/icon-${s}.png" -w "${s}" -h "${s}"
    done
  else
    echo "Please install ImageMagick (magick/convert), librsvg (rsvg-convert), or Inkscape." >&2
    exit 1
  fi

  # Generate ICO from 16/32/48 if ImageMagick is missing
  if command -v magick >/dev/null 2>&1; then
    magick "icons/icon-16.png" "icons/icon-32.png" "icons/icon-48.png" favicon.ico
  elif command -v convert >/dev/null 2>&1; then
    convert "icons/icon-16.png" "icons/icon-32.png" "icons/icon-48.png" favicon.ico
  else
    echo "Skipping favicon.ico (need ImageMagick)." >&2
  fi
fi

# Open Graph PNG (optional) — render from SVG if possible
if command -v magick >/dev/null 2>&1; then
  magick -background none og-image.svg -resize 1200x630 og-image.png
elif command -v convert >/dev/null 2>&1; then
  convert -background none og-image.svg -resize 1200x630 og-image.png
elif command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 1200 -h 630 -o og-image.png og-image.svg
elif command -v inkscape >/dev/null 2>&1; then
  inkscape og-image.svg --export-type=png --export-filename=og-image.png -w 1200 -h 630
else
  echo "OG PNG not rendered (no rasterizer found)." >&2
fi

echo "\u2713 Brand PNG icons and og-image.png generated in $(pwd)"
