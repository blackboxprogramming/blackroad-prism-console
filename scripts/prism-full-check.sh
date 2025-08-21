#!/usr/bin/env bash
# One-button: check API systemd, nginx config, and all public routes.
set -euo pipefail
echo "== systemd: blackroad-api =="
systemctl status blackroad-api --no-pager || true
echo "== nginx test =="
nginx -t
echo "== Routes =="
for p in "/" "/status" "/portal" "/docs" "/api/health.json"; do
  code=$(curl -o /dev/null -s -w "%{http_code}" "http://127.0.0.1$p" || true)
  printf "  %-16s %s\n" "$p" "$code"
done
