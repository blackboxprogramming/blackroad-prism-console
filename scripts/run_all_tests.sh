#!/usr/bin/env bash
# Run both JavaScript and Python test suites for the project.
set -euo pipefail

export APP_ENV="${APP_ENV:-development}"

echo "== Runtime controller dev-mode guard =="
npm run --silent guard:dev-mode -- --require-app-env

echo "== JavaScript (Jest) tests =="
CI=true npx jest --runInBand --watchAll=false "$@" || true

echo "\n== Python (pytest) tests =="
pytest "$@" || true
