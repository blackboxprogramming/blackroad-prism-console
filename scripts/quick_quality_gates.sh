#!/usr/bin/env bash
set -euo pipefail
echo "== Quick quality gates for BlackRoad Prism Console =="

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "Running ops/install.sh (may install deps)"
bash ops/install.sh

if [ -f "package.json" ]; then
  echo "Running npm run format:check"
  npm run format:check

  echo "Running npm run lint"
  npm run lint

  echo "Running npm test"
  npm test
else
  echo "Warning: package.json not found; skipping repository npm checks"
fi

if [ -d "srv/blackroad-api" ]; then
  echo "Running API tests and lint"
  pushd srv/blackroad-api >/dev/null
  npm test --silent
  npm run lint --silent
  popd >/dev/null
else
  echo "Warning: srv/blackroad-api not found; skipping API tests"
fi

if [ -d "srv/lucidia-llm" ]; then
  echo "Running Pytest for srv/lucidia-llm/test_app.py"
  pytest srv/lucidia-llm/test_app.py
else
  echo "Warning: srv/lucidia-llm not found; skipping Pytest"
fi

echo "Running health checks"
npm run health || { echo "health check failed"; exit 2; }

echo "All quick checks passed"
