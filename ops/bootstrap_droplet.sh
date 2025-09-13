#!/usr/bin/env bash
set -euo pipefail
: "${DROPLET_HOST:?Set DROPLET_HOST}"
ssh root@"$DROPLET_HOST" 'apt-get update -y && apt-get install -y nginx git curl rsync nodejs npm pm2'
ssh root@"$DROPLET_HOST" 'mkdir -p /srv/blackroad-api /var/www/blackroad /srv/releases'
# Install hardened nginx if provided
scp -q ops/nginx/blackroad.conf.hardened root@"$DROPLET_HOST":/etc/nginx/sites-available/blackroad.conf || true
ssh root@"$DROPLET_HOST" 'ln -sfn /etc/nginx/sites-available/blackroad.conf /etc/nginx/sites-enabled/blackroad.conf || true'
ssh root@"$DROPLET_HOST" 'nginx -t && systemctl reload nginx || true'
echo "Bootstrap complete"

