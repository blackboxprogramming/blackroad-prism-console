#!/usr/bin/env bash
# One-button backup (local or remote). Requires SSH access for remote host.
set -euo pipefail
MODE="${1:-local}" # local|remote
HOST="${DROPLET_HOST:-159.65.43.12}"
STAMP="$(date +%Y%m%d%H%M%S)"
OUT="backup/${STAMP}"
mkdir -p "$OUT"

if [ "$MODE" = "remote" ]; then
  echo "Remote snapshot from ${HOST}"
  ssh root@"$HOST" 'test -f /srv/blackroad-api/blackroad.db || true'
  rsync -az root@"$HOST":/srv/blackroad-api/blackroad.db "$OUT"/blackroad.db || true
  rsync -az root@"$HOST":/etc/nginx/sites-available/blackroad.conf "$OUT"/nginx.conf || true
else
  cp apps/api/blackroad.db "$OUT"/blackroad.db 2>/dev/null || true
  cp apps/web/nginx.sample.conf "$OUT"/nginx.conf 2>/dev/null || true
fi

tar -czf "$OUT".tar.gz "$OUT"
echo "Wrote $OUT.tar.gz"
