#!/usr/bin/env bash
set -euo pipefail

REMOTE=${REMOTE:-git@github.com:blackboxprogramming/blackroad.git}
BRANCH=${BRANCH:-main}
DROPLET_HOST=${DROPLET_HOST:-root@blackroad-digitalocean}

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

trigger_syncs() {
  log "Triggering connector syncs (placeholder)"
  if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Deploy triggered for $BRANCH\"}" "$SLACK_WEBHOOK" >/dev/null
  fi
}

push_latest() {
  log "Pushing latest changes"
  git pull --rebase "$REMOTE" "$BRANCH"
  git push "$REMOTE" "$BRANCH"
  trigger_syncs
}

refresh_working_copy() {
  log "Refreshing local working copy"
  git pull "$REMOTE" "$BRANCH"
}

deploy_droplet() {
  log "Deploying to droplet"
  ssh "$DROPLET_HOST" <<'SSH'
set -e
cd /srv/blackroad-prism-console
git pull
npm install --production || true
pm2 restart all || true
SSH
  log "Droplet deployment complete"
}

rebase_branch() {
  log "Rebasing branch onto remote"
  git fetch "$REMOTE" "$BRANCH"
  git rebase "$REMOTE/$BRANCH"
  git push --force-with-lease "$REMOTE" "$BRANCH"
}

sync_connectors() {
  log "Syncing Salesforce -> Airtable -> Droplet (placeholder)"
  # Placeholder for connector jobs
}

case "${1:-}" in
  push)
    push_latest
    ;;
  refresh)
    refresh_working_copy
    ;;
  deploy)
    deploy_droplet
    ;;
  rebase)
    rebase_branch
    ;;
  sync)
    sync_connectors
    ;;
  *)
    cat <<USAGE
Usage: $0 <command>

Commands:
  push      Commit + push to GitHub then trigger syncs
  refresh   Refresh local working copy from remote
  deploy    Pull latest on droplet and restart services
  rebase    Rebase local branch onto remote and force-push
  sync      Run connector sync jobs (placeholder)
USAGE
    ;;
esac
