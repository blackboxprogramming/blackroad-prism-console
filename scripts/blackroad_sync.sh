#!/usr/bin/env bash
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
