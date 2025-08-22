#!/usr/bin/env bash
set -euo pipefail

# Installs the watchdog service+timer to auto-heal API and NGINX
install -m 755 blackroad-watchdog.sh /usr/local/bin/blackroad-watchdog.sh
install -m 644 systemd/blackroad-watchdog.service /etc/systemd/system/blackroad-watchdog.service
install -m 644 systemd/blackroad-watchdog.timer /etc/systemd/system/blackroad-watchdog.timer
systemctl daemon-reload
systemctl enable --now blackroad-watchdog.timer
systemctl list-timers | grep blackroad-watchdog || true
echo "Watchdog enabled."
