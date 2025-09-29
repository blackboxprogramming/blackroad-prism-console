#!/usr/bin/env bash
set -euo pipefail
echo "== count-objects =="
git -C ~/lucidia count-objects -vH || true
echo "== nginx symlinks =="
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
NGINX_AVAILABLE_DIR="/etc/nginx/sites-available"
if [ -d "$NGINX_ENABLED_DIR" ]; then
  avail_real=$(readlink -f "$NGINX_AVAILABLE_DIR" 2>/dev/null || true)
  shopt -s nullglob
  found_links=0
  issues=0
  for entry in "$NGINX_ENABLED_DIR"/*; do
    name=$(basename "$entry")
    if [ -L "$entry" ]; then
      found_links=1
      if [ ! -e "$entry" ]; then
        echo "  - $name -> BROKEN (target missing: $(readlink "$entry"))"
        issues=1
        continue
      fi

      target_real=$(readlink -f "$entry" 2>/dev/null || true)
      if [ -n "$target_real" ] && [ -n "$avail_real" ] && [[ "$target_real" != "$avail_real"/* ]]; then
        echo "  - $name -> $target_real (outside sites-available/)"
        issues=1
      else
        echo "  - $name -> $(readlink "$entry")"
      fi
    else
      found_links=1
      echo "  - $name (NOT a symlink)"
      issues=1
    fi
  done
  shopt -u nullglob

  if [ "$found_links" -eq 0 ]; then
    echo "  (no enabled vhosts)"
  elif [ "$issues" -eq 0 ]; then
    echo "  ✓ all enabled vhosts are valid symlinks"
  else
    echo "  ✗ fix the issues above before reloading nginx"
  fi
else
  echo "  directory $NGINX_ENABLED_DIR not found"
fi

echo "== nginx config =="
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && systemctl is-active nginx || true
else
  echo "  nginx binary not present"
fi
echo "== api =="
systemctl is-active blackroad-api || true
curl -fsS http://127.0.0.1:4000/api/health.json || true
echo "== site =="
curl -I -s http://127.0.0.1 | head -1 || true
