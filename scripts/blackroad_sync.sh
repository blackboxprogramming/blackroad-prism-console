#!/usr/bin/env bash
# blackroad_sync.sh - Unified sync & deploy for BlackRoad.io
#
# This script pushes local changes to GitHub, propagates updates to
# connected services, syncs the working copy on the droplet, and
# restarts services so updates are live on BlackRoad.io.
#
# Usage:
#   scripts/blackroad_sync.sh push "commit message"  # commit & push local changes
#   scripts/blackroad_sync.sh refresh                 # pull & redeploy latest
#
# The script uses environment variables for remote access:
#   GIT_REMOTE (default: origin)
#   DROPLET_HOST (e.g. user@1.2.3.4)
#   DROPLET_REPO (default: /srv/blackroad)
#   WEBHOOK_URL (optional webhook for Slack/Airtable/etc.)
#
set -euo pipefail

REMOTE="${GIT_REMOTE:-origin}"
DROPLET="${DROPLET_HOST:-}"
DROPLET_REPO="${DROPLET_REPO:-/srv/blackroad}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

notify(){
  if [[ -n "${WEBHOOK_URL:-}" ]]; then
    "${SCRIPT_DIR}/webhook-notify.py" "$1" "$2" || true
  fi
}

commit_and_push(){
  msg=${1:-"update"}
  git add -A
  if git diff --cached --quiet; then
    echo "No changes to commit."
  else
    git commit -m "$msg"
  fi
  git push "$REMOTE" HEAD
  notify "git_push" "$msg"
}

pull_and_rebase(){
  git fetch "$REMOTE"
  git rebase "$REMOTE/main" || {
    echo "Auto rebase failed; attempting merge" >&2
    git merge --no-edit "$REMOTE/main" || true
  }
  notify "git_sync" "rebase"
}

sync_droplet(){
  [[ -n "$DROPLET" ]] || { echo "DROPLET_HOST not set" >&2; return 1; }
  ssh "$DROPLET" "set -euo pipefail; cd '$DROPLET_REPO'; git fetch --all; git reset --hard '$REMOTE/main'; npm ci --omit=dev || npm install; pm2 restart all || systemctl restart blackroad-api || true" && notify "droplet_sync" "$DROPLET"
}

case "${1:-}" in
  push)
    commit_and_push "${2:-update}"
    sync_droplet
    ;;
  refresh)
    pull_and_rebase
    sync_droplet
    ;;
  *)
    echo "Usage: $0 [push <msg>|refresh]" >&2
    exit 1
    ;;
 esac
