#!/usr/bin/env bash
set -euo pipefail

# Installs Lucidia Infinity Math auto-heal watchdog
install -m 755 usr/local/bin/lucidia-math-autoheal.sh /usr/local/bin/lucidia-math-autoheal.sh
install -m 644 systemd/lucidia-math-autoheal.service /etc/systemd/system/lucidia-math-autoheal.service
install -m 644 systemd/lucidia-math-autoheal.timer /etc/systemd/system/lucidia-math-autoheal.timer
systemctl daemon-reload
systemctl enable --now lucidia-math-autoheal.timer
systemctl list-timers | grep lucidia-math-autoheal || true
echo "Lucidia Infinity Math auto-heal enabled."
