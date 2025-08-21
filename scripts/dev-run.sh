#!/usr/bin/env bash
set -euo pipefail

# One-liner dev runner for site + API in foreground terminals

# Usage: bash scripts/dev-run.sh

tmux new-session -d -s blackroad \
  "cd services/api && npm i && npm run dev" \; \
  split-window -h "cd sites/blackroad && npm i && npm run dev" \; \
  attach -t blackroad
