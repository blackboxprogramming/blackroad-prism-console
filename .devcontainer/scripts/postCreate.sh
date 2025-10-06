#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[postCreate] $1"
}

log "Ensuring corepack and pnpm availability"
if command -v corepack >/dev/null 2>&1; then
  corepack enable pnpm >/dev/null 2>&1 || log "corepack enable pnpm exited with status $?"
fi

log "Installing global npm tooling"
npm install --global @commitlint/cli @commitlint/config-conventional \
  >/tmp/postcreate-npm.log 2>&1 || (cat /tmp/postcreate-npm.log && exit 1)

log "Installing Python tooling"
python3 -m pip install --user --upgrade pip >/tmp/postcreate-pip.log 2>&1 \
  || (cat /tmp/postcreate-pip.log && exit 1)
python3 -m pip install --user pre-commit >/tmp/postcreate-precommit.log 2>&1 \
  || (cat /tmp/postcreate-precommit.log && exit 1)

if [ -f requirements-dev.txt ]; then
  log "Installing Python dev requirements"
  python3 -m pip install --user -r requirements-dev.txt >/tmp/postcreate-reqdev.log 2>&1 \
    || (cat /tmp/postcreate-reqdev.log && exit 1)
fi

if [ -f package-lock.json ]; then
  log "Installing Node.js dependencies via npm ci"
  npm ci >/tmp/postcreate-npmci.log 2>&1 || (cat /tmp/postcreate-npmci.log && exit 1)
fi

if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  log "Bootstrapping pnpm workspace"
  pnpm install >/tmp/postcreate-pnpm.log 2>&1 || (cat /tmp/postcreate-pnpm.log && exit 1)
fi

if command -v git >/dev/null 2>&1; then
  current_dir="$(pwd)"
  if ! git config --global --get-all safe.directory 2>/dev/null | grep -Fxq "$current_dir"; then
    log "Marking $current_dir as a safe Git directory"
    git config --global --add safe.directory "$current_dir"
  fi
fi

log "Post-create steps complete"
