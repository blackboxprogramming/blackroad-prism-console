#!/usr/bin/env bash
<<<<<<< HEAD
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
#!/bin/bash
# Scaffold script for BlackRoad.io end-to-end sync and deployment.
# This is a placeholder that outlines the desired flow.

set -euo pipefail

# 1. GitHub integration
# TODO: auto-commit and push changes, handle branches, trigger downstream syncs.

# 2. Connector jobs (Salesforce, Airtable, Slack, Linear, etc.)
# TODO: provide OAuth scaffolding and webhook listeners.
# TODO: enable background jobs to synchronize metadata and assets.
# TODO: post status updates to Slack.

# 3. Working Copy automation
# TODO: automate pull/push to refresh local state on iOS devices.

# 4. Droplet deployment
# TODO: auto-pull latest code, run migrations, and restart services.
# TODO: expose /health and /deploy/status endpoints.

# 5. BlackRoad.io live refresh
# TODO: verify SPA and backend refresh after deployment.
# TODO: ensure logs/errors flow back for debugging.

# 6. Resilience and manual override
# TODO: support forced refresh, retry, or rollback on failure.
# TODO: log all actions for traceability.

printf "BlackRoad sync scaffold: implementation pending.\n"
# BlackRoad.io: Unified sync & deploy helper
# Provides chat-first commands to push, refresh, rebase, and sync connectors.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load environment variables from .env if present
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ROOT/.env"
  set +a
fi

log() { printf '>> %s\n' "$*" >&2; }

push_latest() {
  local branch="${1:-main}"
  log "Committing and pushing to $branch"
  git -C "$ROOT" add -A
  git -C "$ROOT" commit -m "chore: sync from Codex" || true
  git -C "$ROOT" pull --rebase origin "$branch"
  git -C "$ROOT" push origin "$branch"
  log "Triggering downstream webhooks"
  [ -n "${POST_PUSH_WEBHOOK:-}" ] && curl -fsSL "$POST_PUSH_WEBHOOK" -o /dev/null || true
}

refresh_working_copy() {
  log "Refreshing Working Copy"
  [ -n "${WORKING_COPY_SSH:-}" ] || return 0
  ssh "$WORKING_COPY_SSH" "cd ${WORKING_COPY_PATH:-~/blackroad} && git pull --rebase"
}

rebase_branch() {
  local branch="${1:-main}"
  log "Rebasing current branch onto origin/$branch"
  git -C "$ROOT" fetch origin "$branch"
  git -C "$ROOT" rebase "origin/$branch"
  git -C "$ROOT" push --force-with-lease origin HEAD
}

sync_connectors() {
  log "Syncing Salesforce → Airtable"
  [ -n "${SALESFORCE_WEBHOOK:-}" ] && curl -fsSL "$SALESFORCE_WEBHOOK" -o /dev/null || true
  [ -n "${AIRTABLE_WEBHOOK:-}" ] && curl -fsSL "$AIRTABLE_WEBHOOK" -o /dev/null || true
  [ -n "${SLACK_WEBHOOK:-}" ] && curl -fsSL -H 'Content-type: application/json' \
    --data '{"text":"BlackRoad sync complete"}' "$SLACK_WEBHOOK" || true
}

deploy_droplet() {
  log "Deploying to droplet"
  [ -n "${DROPLET_SSH:-}" ] || return 0
  ssh "$DROPLET_SSH" <<'SSH'
set -e
cd /srv/blackroad
git pull --rebase
npm ci --production >/dev/null 2>&1 || true
npm run migrate >/dev/null 2>&1 || true
sudo systemctl restart blackroad-api
sudo systemctl restart blackroad-llm || true
sudo systemctl reload nginx
curl -fsSL localhost/deploy/status || true
SSH
}

usage() {
  cat <<'USAGE'
Usage: scripts/blackroad_sync.sh <command> [args]

Commands:
  push [branch]        Commit/push current repo and trigger webhooks
  refresh              Pull Working Copy and redeploy droplet
  rebase [branch]      Rebase current branch on origin/<branch> then push
  sync-connectors      Run Salesforce/Airtable connectors and notify Slack
  deploy               Deploy latest code to droplet
  all                  push -> sync-connectors -> refresh -> deploy
USAGE
}

cmd="${1:-help}"
shift || true
case "$cmd" in
  push) push_latest "$@";;
  refresh) refresh_working_copy; deploy_droplet;;
  rebase) rebase_branch "$@"; deploy_droplet;;
  sync-connectors) sync_connectors;;
  deploy) deploy_droplet;;
  all) push_latest "$@"; sync_connectors; refresh_working_copy; deploy_droplet;;
  help|*) usage;;
esac

=======
set -euo pipefail

# Unified Codex build script for BlackRoad.io
# Orchestrates GitHub push, connector syncs, working copy refresh,
# droplet deployment, and optional Slack notifications.
#
# Environment variables:
#   DROPLET_HOST        SSH host for production droplet
#   DROPLET_PATH        Directory on the droplet containing the repo
#   SLACK_WEBHOOK_URL   Incoming webhook for status updates (optional)
#   WORKING_COPY_PATH   Path for iOS Working Copy repo (optional)
#   GIT_REMOTE          Git remote name (default: origin)
#
# Usage examples:
#   $0 push "Update message"    # git pull --rebase && git push
#   $0 deploy                   # deploy latest commit to droplet
#   $0 refresh                  # refresh working copy and redeploy
#   $0 sync-connectors          # run connector jobs
#
# NOTE: Connector and Working Copy operations are scaffolds and require
#       platform specific configuration to be fully functional.

log() {
  local msg="$1"
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$ts] $msg" | tee -a blackroad_sync.log
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\": \"$msg\"}" "$SLACK_WEBHOOK_URL" >/dev/null || true
  fi
}

push_latest() {
  local remote=${GIT_REMOTE:-origin}
  local msg=${1:-"Automated update"}
  log "Pulling latest from $remote"
  git pull --rebase "$remote" main
  log "Pushing changes to $remote"
  git push "$remote" HEAD:main
  log "Git push complete: $msg"
}

deploy_droplet() {
  if [[ -z "${DROPLET_HOST:-}" || -z "${DROPLET_PATH:-}" ]]; then
    log "DROPLET_HOST and DROPLET_PATH must be set for deployment"
    return 1
  fi
  log "Deploying to $DROPLET_HOST:$DROPLET_PATH"
  ssh "$DROPLET_HOST" <<EOF2
set -euo pipefail
cd "$DROPLET_PATH"
git pull --rebase
npm ci --omit=dev || true
npm run migrate || true
pm2 restart blackroad-api || true
sudo systemctl reload nginx || true
echo "Deployment complete"
EOF2
  log "Droplet deployment finished"
}

refresh_working_copy() {
  if [[ -z "${WORKING_COPY_PATH:-}" ]]; then
    log "WORKING_COPY_PATH not set; skipping Working Copy sync"
    return 0
  fi
  log "Refreshing Working Copy at $WORKING_COPY_PATH"
  git -C "$WORKING_COPY_PATH" pull --rebase || true
  git -C "$WORKING_COPY_PATH" push || true
  log "Working Copy sync complete"
}

sync_connectors() {
  log "Running connector jobs (Salesforce, Airtable, Linear, etc.)"
  # Placeholder commands for connectors
  # ./connectors/salesforce_sync.sh
  # ./connectors/airtable_sync.sh
  # ./connectors/linear_sync.sh
  log "Connector jobs finished (placeholders)"
}

case "${1:-}" in
  push)
    shift
    push_latest "$@"
    ;;
  deploy)
    deploy_droplet
    ;;
  refresh)
    refresh_working_copy
    deploy_droplet
    ;;
  sync-connectors)
    sync_connectors
    ;;
  *)
    echo "Usage: $0 {push|deploy|refresh|sync-connectors} [args]" >&2
    exit 1
    ;;
esac
>>>>>>> 431d6e5387277e5cf7c78787ba49959cc5be1408
