#!/usr/bin/env bash
map="/workspace/blackroad-prism-console/ritual/activation_map.md"
if [ ! -f "$map" ]; then
  echo "No activation map yet. Run the generator first."
  exit 1
fi
clear
echo "🜁 Lucidia Activation • $(date -u +"%Y-%m-%d %H:%M:%SZ")"
echo "-----------------------------------------------------"
grep -E '^(#|##|•|  -|\*\*)|^$' "$map" | sed \
  -e 's/^# /\n== /' \
  -e 's/^## /\n— /' \
  -e 's/^• / * /' \
  -e 's/^\*\*\(.*\)\*\*/\1:'
echo
echo "[q] quit  [r] refresh"
while read -rsn1 key; do
  case "$key" in
    q)
      break
      ;;
    r)
      clear
      echo "🜁 Lucidia Activation • $(date -u +"%Y-%m-%d %H:%M:%SZ")"
      echo "-----------------------------------------------------"
      grep -E '^(#|##|•|  -|\*\*)|^$' "$map" | sed \
        -e 's/^# /\n== /' \
        -e 's/^## /\n— /' \
        -e 's/^• / * /' \
        -e 's/^\*\*\(.*\)\*\*/\1:'
      echo
      ;;
  esac
done
