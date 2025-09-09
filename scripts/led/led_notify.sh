#!/usr/bin/env bash
# Usage: led_notify.sh emotion [ttl]
# emotion: ok|busy|error|thinking|celebrate|help
set -euo pipefail
EMO="${1:-ok}"; TTL="${2:-10}"
BASE="${LED_BASE:-http://127.0.0.1:4000}"
curl -sS -H 'content-type: application/json' \
  -d "{\"type\":\"led.emotion\",\"emotion\":\"$EMO\",\"ttl_s\":$TTL}" \
  "$BASE/api/devices/pi-01/command" >/dev/null || true
