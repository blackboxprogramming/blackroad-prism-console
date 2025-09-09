#!/usr/bin/env bash
# Usage: led_notify.sh thinking|busy|ok|error|celebrate|help [ttl]
set -euo pipefail
EMO="${1:-ok}"; TTL="${2:-30}"
KEY="$(sudo cat /srv/secrets/origin.key 2>/dev/null || true)"
curl -sS -H "X-BlackRoad-Key: $KEY" -H 'content-type: application/json' \
  -d "{\"type\":\"led.emotion\",\"emotion\":\"$EMO\",\"ttl_s\":$TTL}" \
  http://127.0.0.1:4000/api/devices/pi-01/command >/dev/null || true
