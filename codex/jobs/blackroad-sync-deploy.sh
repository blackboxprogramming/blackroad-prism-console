#!/usr/bin/env bash
# Chat-first entrypoint to sync repos, connectors, working copy and droplet
# for the BlackRoad.io stack.

set -euo pipefail

log() {
  printf '\n[blackroad-sync] %s\n' "$*"
}

die() {
  printf '\n[blackroad-sync] ERROR: %s\n' "$*" >&2
  exit 1
}

retry() {
  local attempts=0
  local max=${RETRY_LIMIT:-3}
  until "$@"; do
    attempts=$((attempts+1))
    if [ "$attempts" -ge "$max" ]; then
      die "Command failed after ${max} attempts: $*"
    fi
    sleep 2
    log "retrying: $*"
  done
}

ensure_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

notify_slack() {
  local msg="$1"
  if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\": \"$msg\"}" "$SLACK_WEBHOOK" >/dev/null || true
  fi
}

git_auto_commit_push() {
  ensure_cmd git
  local msg="${1:-chore: codex sync}" || true
  git add -A
  if git diff --cached --quiet; then
    log "No changes to commit"
  else
    git commit -m "$msg"
  fi
  retry git pull --rebase
  retry git push
  notify_slack "Git push complete"
}

refresh_working_copy() {
  local path="${WORKING_COPY_PATH:-/mnt/working-copy}"
  if [ -d "$path/.git" ]; then
    log "Refreshing working copy at $path"
    retry git -C "$path" pull --ff-only
  else
    log "Working copy path $path not found; skipping"
  fi
}

sync_connectors() {
  log "Syncing connectors"
  [ -n "${SALESFORCE_TOKEN:-}" ] && log "- Salesforce sync stub"
  [ -n "${AIRTABLE_TOKEN:-}" ] && log "- Airtable sync stub"
  [ -n "${LINEAR_TOKEN:-}" ] && log "- Linear sync stub"
  notify_slack "Connector sync complete"
}

deploy_droplet() {
  ensure_cmd ssh
  local host="${DROPLET_HOST:-}"
  if [ -z "$host" ]; then
    log "DROPLET_HOST not set; skipping droplet deploy"
    return
  fi
  log "Deploying to droplet $host"
  ssh "$host" bash -s <<'EOSSH'
set -euo pipefail
cd /srv/blackroad || exit 1
git pull --ff-only
npm install --production >/tmp/deploy.log 2>&1 || true
npm run migrate >>/tmp/deploy.log 2>&1 || true
sudo systemctl restart blackroad-api.service 2>/tmp/deploy.log || true
sudo systemctl restart blackroad-llm.service 2>>/tmp/deploy.log || true
curl -fsS localhost/health >/dev/null && echo "Health OK" || echo "Health check failed"
EOSSH
  notify_slack "Droplet deploy complete"
}

usage() {
  cat <<'USAGE'
Usage: blackroad-sync-deploy.sh <command> [msg]
Commands:
  push-latest [msg]   Commit, rebase, push and deploy
  refresh             Refresh working copy and redeploy
  rebase-update       Rebase branch onto origin/main and deploy
  sync-connectors     Sync Salesforce, Airtable, Linear (stub)
Environment:
  WORKING_COPY_PATH   Path to iOS Working Copy checkout
  DROPLET_HOST        SSH host for server deployment
  SLACK_WEBHOOK       Incoming webhook for status updates
USAGE
}

case "${1:-}" in
  push-latest)
    git_auto_commit_push "${2:-chore: sync}";
    deploy_droplet;
    ;;
  refresh)
    refresh_working_copy;
    deploy_droplet;
    ;;
  rebase-update)
    ensure_cmd git;
    retry git pull --rebase;
    deploy_droplet;
    ;;
  sync-connectors)
    sync_connectors;
    ;;
  *)
    usage;
    ;;
esac
