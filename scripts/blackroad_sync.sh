#!/usr/bin/env bash
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
