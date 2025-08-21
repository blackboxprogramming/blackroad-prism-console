#!/bin/bash
set -euo pipefail

apt-get install -y docker.io
docker network create cicd || true
cat <<ENV > /srv/woodpecker.env
WOODPECKER_OPEN=false
WOODPECKER_GITEA=true
WOODPECKER_SERVER_ADDR=:8000
ENV
