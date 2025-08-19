#!/bin/bash
set -euo pipefail

apt-get install -y python3-devpi
mkdir -p /srv/devpi
if ! id devpi >/dev/null 2>&1; then
  useradd -r -m -d /srv/devpi devpi
fi
sudo -u devpi devpi-init || true
sudo -u devpi devpi-server --start --host 0.0.0.0 --port 3141
