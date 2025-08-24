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
set -euo pipefail

# Unified flow for syncing and deploying BlackRoad.io.
# The script accepts chat-like commands, for example:
#   ./scripts/blackroad_sync.sh "Push latest to BlackRoad.io"
# Environment variables:
#   CONNECTOR_SYNC_URL - webhook to trigger connector jobs
#   WORKING_COPY_PATH  - path to Working Copy checkout (default: current repo)
#   DROPLET_HOST       - SSH host for the deployment droplet
#   DROPLET_REFRESH_CMD - remote command to refresh and deploy

CONNECTOR_SYNC_URL="${CONNECTOR_SYNC_URL:-}"
WORKING_COPY_PATH="${WORKING_COPY_PATH:-$(pwd)}"
DROPLET_HOST="${DROPLET_HOST:-root@droplet}"
DROPLET_REFRESH_CMD="${DROPLET_REFRESH_CMD:-/usr/local/bin/blackroad-refresh}"

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

github_sync() {
  log "Syncing with GitHub"
  git pull --rebase
  if ! git diff --quiet; then
    git commit -am "chore: codex sync" || true
  fi
  git push
}

trigger_connectors() {
  if [[ -z "$CONNECTOR_SYNC_URL" ]]; then
    log "CONNECTOR_SYNC_URL not set; skipping connector sync"
    return 0
  fi
  log "Triggering connector webhook"
  curl -fsS "$CONNECTOR_SYNC_URL" || log "Connector webhook failed"
}

working_copy_refresh() {
  log "Refreshing Working Copy at $WORKING_COPY_PATH"
  (cd "$WORKING_COPY_PATH" && git pull --rebase)
}

droplet_deploy() {
  log "Deploying to droplet $DROPLET_HOST"
  ssh "$DROPLET_HOST" "$DROPLET_REFRESH_CMD"
}

COMMAND="${1:-}"
case "$COMMAND" in
  "Push latest to BlackRoad.io")
    github_sync
    trigger_connectors
    working_copy_refresh
    droplet_deploy
    ;;
  "Refresh working copy and redeploy")
    working_copy_refresh
    droplet_deploy
    ;;
  "Rebase branch and update site")
    github_sync
    droplet_deploy
    ;;
  "Sync Salesforce -> Airtable -> Droplet"|"Sync Salesforce → Airtable → Droplet")
    trigger_connectors
    droplet_deploy
    ;;
  *)
    cat <<USAGE
Usage: $0 "<command>"
Commands:
  Push latest to BlackRoad.io
  Refresh working copy and redeploy
  Rebase branch and update site
  Sync Salesforce -> Airtable -> Droplet
USAGE
    ;;
esac
