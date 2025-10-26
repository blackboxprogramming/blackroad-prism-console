#!/usr/bin/env bash
set -euo pipefail

if ! uname -m | grep -qi 'aarch64'; then
  echo "ERROR: Use 64-bit Raspberry Pi OS (Bookworm) on Pi 4/5." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl git jq xz-utils \
                        chromium-browser xserver-xorg xinit openbox unclutter || true

# Docker engine + compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

sudo mkdir -p /opt/blackroad
sudo rsync -a --exclude '.git' ./ /opt/blackroad/
sudo chown -R $USER:$USER /opt/blackroad

# systemd units
sudo cp /opt/blackroad/os/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

echo '-----'
echo 'BlackRoad OS installed to /opt/blackroad'
echo 'Next steps:'
echo '  cd /opt/blackroad/os/docker && cp .env.example .env'
echo '  sudo systemctl enable --now blackroad-compose'
echo '  /opt/blackroad/os/brctl doctor'
