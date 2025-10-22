#!/usr/bin/env bash
set -euo pipefail
STAMP="$(date +%Y%m%d%H%M%S)"
mkdir -p backup
mkdir -p backup/"$STAMP"
# Include DB (if exists locally in workspace) and minimal config
cp -f apps/api/blackroad.db backup/"$STAMP"/blackroad.db 2>/dev/null || true
cp -f apps/web/nginx.sample.conf backup/"$STAMP"/nginx.conf 2>/dev/null || true
echo "$STAMP" > backup/"$STAMP"/meta.txt
echo "done"
