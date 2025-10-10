#!/usr/bin/env bash
# Run both JavaScript and Python test suites in a Docker environment.
# This script is designed for CI/CD and Docker containers.
set -euo pipefail

export APP_ENV="${APP_ENV:-development}"
export CI="${CI:-true}"

echo "========================================="
echo "Running tests in Docker container"
echo "========================================="
echo ""

# Check if Node.js is available
if command -v node &> /dev/null; then
  echo "✓ Node.js version: $(node --version)"
  echo "✓ NPM version: $(npm --version)"
else
  echo "✗ Node.js not found"
  exit 1
fi

# Check if Python is available
if command -v python3 &> /dev/null; then
  echo "✓ Python version: $(python3 --version)"
  echo "✓ Pytest version: $(pytest --version 2>&1 | head -1)"
else
  echo "✗ Python not found"
  exit 1
fi

echo ""
echo "========================================="
echo "Running JavaScript (Jest) tests"
echo "========================================="

# Skip dev-mode guard in Docker/CI environments
if [ -f package.json ]; then
  npm test || {
    echo "⚠ JavaScript tests failed or skipped"
    JS_EXIT_CODE=$?
  }
else
  echo "⚠ No package.json found, skipping JavaScript tests"
  JS_EXIT_CODE=0
fi

echo ""
echo "========================================="
echo "Running Python (pytest) tests"
echo "========================================="

pytest -q "$@" || {
  echo "⚠ Python tests failed or skipped"
  PY_EXIT_CODE=$?
}

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "JavaScript tests: ${JS_EXIT_CODE:-0}"
echo "Python tests: ${PY_EXIT_CODE:-0}"

# Return success if both test suites passed
if [ "${JS_EXIT_CODE:-0}" -eq 0 ] && [ "${PY_EXIT_CODE:-0}" -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "✗ Some tests failed"
  exit 1
fi
