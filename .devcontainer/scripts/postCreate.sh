#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[postCreate] $1"
}

run_step() {
  local message="$1"
  local logfile="$2"
  shift 2

  log "$message"
  if ! "$@" >"$logfile" 2>&1; then
    cat "$logfile"
    exit 1
  fi
}

log "Ensuring corepack and pnpm availability"
if command -v corepack >/dev/null 2>&1; then
  corepack enable pnpm >/tmp/postcreate-corepack.log 2>&1 || \
    log "corepack enable pnpm exited with status $?"
fi

run_step "Installing global npm tooling" /tmp/postcreate-npm.log \
  npm install --location=global --no-audit --no-fund \
    @commitlint/cli @commitlint/config-conventional

run_step "Upgrading pip" /tmp/postcreate-pip.log \
  python3 -m pip install --user --upgrade pip

run_step "Installing Python pre-commit tooling" /tmp/postcreate-precommit.log \
  python3 -m pip install --user pre-commit

if [ -f requirements-dev.txt ]; then
  run_step "Installing Python dev requirements" /tmp/postcreate-reqdev.log \
    python3 -m pip install --user -r requirements-dev.txt
fi

if [ -f package-lock.json ]; then
  run_step "Installing Node.js dependencies via npm ci" /tmp/postcreate-npmci.log \
    npm ci --no-audit --no-fund
fi

if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  run_step "Bootstrapping pnpm workspace" /tmp/postcreate-pnpm.log \
    pnpm install --frozen-lockfile
fi

if command -v git >/dev/null 2>&1; then
  current_dir="$(pwd)"
  if ! git config --global --get-all safe.directory 2>/dev/null | grep -Fxq "$current_dir"; then
    log "Marking $current_dir as a safe Git directory"
    git config --global --add safe.directory "$current_dir"
  fi
fi

log "Post-create steps complete"
