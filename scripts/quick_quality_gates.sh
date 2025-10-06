#!/usr/bin/env bash
set -euo pipefail
echo "== Quick quality gates for BlackRoad Prism Console =="

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "Running ops/install.sh (may install deps)"
bash ops/install.sh

if [ -d "srv/blackroad-api" ]; then
  echo "Running API tests and lint"
  pushd srv/blackroad-api >/dev/null
  npm test --silent
  npm run lint --silent
  popd >/dev/null
else
  echo "Warning: srv/blackroad-api not found; skipping API tests"
fi

echo "Running health checks"
npm run health || { echo "health check failed"; exit 2; }

echo "All quick checks passed"
