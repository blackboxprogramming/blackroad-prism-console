#!/usr/bin/env bash
# usage: notify.sh <channel> <status> <ref>
set -euo pipefail
CHANNEL="${1:-deploy}"; STATUS="${2:-unknown}"; REF="${3:-n/a}"
TEXT="BlackRoad ${CHANNEL}: ${STATUS} — ${REF}"
if [ -n "${SLACK_WEBHOOK:-}" ]; then
  curl -s -X POST -H 'Content-type: application/json' --data "{\"text\":\"${TEXT}\"}" "$SLACK_WEBHOOK" >/dev/null || true
fi
if [ -n "${DISCORD_WEBHOOK:-}" ]; then
  curl -s -X POST -H 'Content-Type: application/json' --data "{\"content\":\"${TEXT}\"}" "$DISCORD_WEBHOOK" >/dev/null || true
fi
echo "$TEXT"

