#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOGFILE="$ROOT/blackroad_sync.log"

GIT_REPO=${GIT_REPO:-"git@github.com:blackboxprogramming/blackroad.git"}
WORKING_COPY_SSH=${WORKING_COPY_SSH:-"user@working-copy"}
DROPLET_SSH=${DROPLET_SSH:-"root@droplet"}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

log() {
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*" | tee -a "$LOGFILE"
}

notify_slack() {
  [ -z "$SLACK_WEBHOOK" ] && return 0
  curl -s -X POST -H 'Content-type: application/json' --data "{\"text\":\"$*\"}" "$SLACK_WEBHOOK" >/dev/null
}

with_retry() {
  local n=0
  until "$@"; do
    n=$((n+1))
    if [ $n -ge 3 ]; then
      return 1
    fi
    log "Retry $n for $*"
    sleep 2
  done
}

git_push() {
  log "Committing and pushing to GitHub"
  with_retry git pull --rebase origin main
  git add -A
  git commit -m "chore: auto-sync from Codex" || log "No changes to commit"
  with_retry git push origin HEAD
}

sync_connectors() {
  log "Triggering connector syncs"
  # TODO: implement Salesforce, Airtable, Linear, etc.
  # Example placeholder:
  # curl -X POST "$CONNECTOR_ENDPOINT" -H "Authorization: Bearer $TOKEN"
}

refresh_working_copy() {
  log "Refreshing Working Copy"
  # TODO: ensure iOS Working Copy app pulls latest
  # Example placeholder:
  # ssh "$WORKING_COPY_SSH" 'cd /path && git pull'
}

deploy_droplet() {
  log "Deploying to droplet"
  # Pull latest code
  ssh "$DROPLET_SSH" 'cd /srv/blackroad && git pull'
  # Run migrations if needed
  ssh "$DROPLET_SSH" 'cd /srv/blackroad && npm run migrate || true'
  # Restart services
  ssh "$DROPLET_SSH" 'sudo systemctl restart blackroad-api blackroad-llm nginx'
  check_health
}

check_health() {
  log "Checking deployment health"
  curl -fsS http://blackroad.io/health >/dev/null
  curl -fsS http://blackroad.io/deploy/status >/dev/null
}

manual_refresh() {
  log "Manual refresh requested"
  ssh "$DROPLET_SSH" 'cd /srv/blackroad && git fetch && git reset --hard origin/main'
  deploy_droplet
}

main() {
  local cmd="${*:-}"
  case "$cmd" in
    "Push latest to BlackRoad.io"|push)
      git_push
      sync_connectors
      refresh_working_copy
      deploy_droplet
      notify_slack "BlackRoad deployed"
      ;;
    "Refresh working copy and redeploy"|refresh)
      refresh_working_copy
      deploy_droplet
      ;;
    "Rebase branch and update site"|rebase)
      with_retry git pull --rebase origin main
      git_push
      deploy_droplet
      ;;
    "Sync Salesforce → Airtable → Droplet"|sync)
      sync_connectors
      deploy_droplet
      ;;
    *)
      cat <<'USAGE'
Usage: scripts/blackroad_sync.sh "<command>"
Commands (natural language or shortcut):
  "Push latest to BlackRoad.io" | push
  "Refresh working copy and redeploy" | refresh
  "Rebase branch and update site" | rebase
  "Sync Salesforce → Airtable → Droplet" | sync
USAGE
      ;;
  esac
}

main "$@"
