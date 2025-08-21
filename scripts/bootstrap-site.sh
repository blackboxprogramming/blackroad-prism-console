#!/usr/bin/env bash
set -euo pipefail

# BlackRoad.io site + API bootstrap (docker compose)
#
# Usage: bash scripts/bootstrap-site.sh

echo ">> Building site"
pushd sites/blackroad >/dev/null
npm ci
npm run build
popd >/dev/null

echo ">> Starting API + Site (Caddy) via docker compose"
docker compose -f docker-compose.prism.yml up -d

echo ">> Health check"
curl -fsS http://127.0.0.1:4000/api/health.json || { echo "API not healthy"; exit 1; }
curl -fsS http://127.0.0.1:8080/ >/dev/null || { echo "Site not serving on :8080"; exit 1; }
echo "OK — site at http://localhost:8080, API at http://localhost:4000"
