#!/bin/bash
set -euo pipefail

apt-get install -y docker.io
mkdir -p /srv/gitea
cat <<CFG > /srv/gitea/app.ini
[server]
DOMAIN=gitea.internal
SSH_DOMAIN=gitea.internal
ROOT_URL=http://gitea.internal/
SSH_PORT=22
[security]
INSTALL_LOCK=true
CFG
