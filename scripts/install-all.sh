#!/usr/bin/env bash
set -euo pipefail
echo "➡ Installing core toolchains (skip-safe)"
# Node
if command -v npm >/dev/null 2>&1; then
  (cd sites/blackroad 2>/dev/null && npm ci || npm i --package-lock-only || true)
fi
# Python
if command -v python3 >/dev/null 2>&1; then
  python3 -m venv .venv || true
  . .venv/bin/activate || true
  pip install -U pip || true
  pip install pytest || true
fi
# Go
if command -v go >/dev/null 2>&1; then
  go env || true
fi
# Rust
if command -v cargo >/dev/null 2>&1; then
  cargo --version || true
fi
echo "✅ install-all complete"
