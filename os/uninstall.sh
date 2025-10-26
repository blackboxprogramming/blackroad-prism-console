#!/usr/bin/env bash
set -euo pipefail
sudo systemctl disable --now blackroad-compose || true
cd /opt/blackroad/os/docker || exit 0
docker compose down || true
sudo rm -f /etc/systemd/system/blackroad-compose.service
sudo systemctl daemon-reload
echo "Uninstalled compose service. Add --purge to remove /opt/blackroad volumes."
