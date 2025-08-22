#!/usr/bin/env bash
set -euo pipefail
LOG=/var/log/blackroad-watchdog.log
touch "$LOG"; chmod 644 "$LOG"

ok()   { echo "$(date -Is) OK   $1"   >> "$LOG"; }
bad()  { echo "$(date -Is) FAIL $1"   >> "$LOG"; }

curl -fsS http://127.0.0.1/api/health.json >/dev/null && ok "api" || { bad "api"; systemctl restart blackroad-api || true; }
nginx -t >/dev/null 2>&1 && ok "nginx-conf" || { bad "nginx-conf"; }
curl -fsS -I http://127.0.0.1 | head -1 >/dev/null && ok "site" || { bad "site"; systemctl reload nginx || true; }

# optional webhook on failure
if grep -q "FAIL" "$LOG"; then
  [ -n "${WEBHOOK_URL:-}" ] && curl -s -X POST -H 'content-type: application/json' -d "{\"event\":\"watchdog-fail\",\"time\":\"$(date -Is)\"}" "$WEBHOOK_URL" || true
fi
