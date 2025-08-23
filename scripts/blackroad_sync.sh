#!/usr/bin/env bash
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

