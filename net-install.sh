#!/usr/bin/env bash
set -euo pipefail

: "${SLACK_WEBHOOK_URL:?SLACK_WEBHOOK_URL must be set}"

install -m 755 usr/local/bin/network-watch.sh /usr/local/bin/network-watch.sh
install -m 644 systemd/network-watch.service /etc/systemd/system/network-watch.service
install -m 644 systemd/network-watch.timer /etc/systemd/system/network-watch.timer

install -d /etc/default
printf 'SLACK_WEBHOOK_URL="%s"\n' "$SLACK_WEBHOOK_URL" > /etc/default/network-watch

systemctl daemon-reload
systemctl enable --now network-watch.timer
systemctl list-timers | grep network-watch || true

echo "network-watch timer enabled"
