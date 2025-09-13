#!/usr/bin/env bash
set -euo pipefail
HOST="${DROPLET_HOST:-159.65.43.12}"
REL="api-$(date +%Y%m%d%H%M%S)"
ssh root@"$HOST" "mkdir -p /srv/releases/${REL}"
rsync -az apps/api/dist/ root@"$HOST":/srv/releases/${REL}/
ssh root@"$HOST" "ln -sfn /srv/releases/${REL} /srv/blackroad-api && systemctl restart blackroad-api || pm2 restart blackroad-api || true"
