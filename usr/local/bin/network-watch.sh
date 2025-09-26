#!/usr/bin/env bash
set -euo pipefail

# Return early if network is up
if ping -c 3 -W 3 8.8.8.8 >/dev/null 2>&1; then
  exit 0
fi

# Alert Slack about the outage
curl -sS -X POST "$SLACK_WEBHOOK_URL" -H 'Content-type: application/json' \
  --data '{"text":":rotating_light: Network outage detected — attempting auto-heal."}' || true

for attempt in 1 2; do
  systemctl restart systemd-networkd || true
  ip addr flush dev eth0 && dhclient -v eth0
  sleep 5
  if ping -c 3 -W 3 8.8.8.8 >/dev/null 2>&1; then
    ts=$(date -Is)
    echo "NETWORK_RESTORED $ts"
    curl -sS -X POST "$SLACK_WEBHOOK_URL" -H 'Content-type: application/json' \
      --data "{\"text\":\":white_check_mark: Network restored at $ts.\"}" || true
    exit 0
  fi
done

ts=$(date -Is)
echo "REBOOT $ts"
curl -sS -X POST "$SLACK_WEBHOOK_URL" -H 'Content-type: application/json' \
  --data '{"text":":rotating_light: Network still unreachable after auto-heal attempts. Rebooting."}' || true
shutdown -r now
