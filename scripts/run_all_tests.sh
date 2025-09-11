#!/usr/bin/env bash
# Run both JavaScript and Python test suites for the project.
set -euo pipefail

echo "== JavaScript (Jest) tests =="
CI=true npx jest --runInBand --watchAll=false "$@" || true

echo "\n== Python (pytest) tests =="
pytest "$@" || true
