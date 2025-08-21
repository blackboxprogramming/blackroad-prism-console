#!/usr/bin/env bash
set -euo pipefail
if [ -f sites/blackroad/package.json ]; then
  pushd sites/blackroad >/dev/null
  npm i
  popd >/dev/null
fi
npm i -D prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin || true
echo "✅ Bootstrap complete"
