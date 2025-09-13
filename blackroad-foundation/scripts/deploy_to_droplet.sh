#!/usr/bin/env bash
set -euo pipefail
HOST="${DROPLET_HOST:-159.65.43.12}"
USER="${USER:-root}"
SSH="ssh -o StrictHostKeyChecking=no ${USER}@${HOST}"
rsync -az --delete --exclude '.git' --exclude 'node_modules' ./ ${USER}@${HOST}:/srv/blackroad
$SSH "cd /srv/blackroad && pnpm i --frozen-lockfile=false && pnpm -w run build:all && pm2 restart blackroad-api || pm2 start apps/api/dist/index.js --name blackroad-api"
