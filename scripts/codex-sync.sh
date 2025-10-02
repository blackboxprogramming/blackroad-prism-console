#!/usr/bin/env bash
set -euo pipefail

# codex-sync.sh - Scaffold an end-to-end flow from Codex to BlackRoad.io.
#
# This script provides a chat-friendly interface for common operations:
#   push    - Commit and push local changes to GitHub.
#   refresh - Pull latest code and redeploy to the droplet.
#   rebase  - Rebase current branch onto main and redeploy.
#   sync    - Synchronize external connectors (Salesforce, Airtable, Slack, Linear).
#
# The implementations are placeholders and should be replaced with
# project-specific commands and authentication hooks.

BRANCH="${BRANCH:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HELPER="${SCRIPT_DIR}/improved_blackroad_deploy.py"

run_deploy_helper() {
  if [[ ! -f "$DEPLOY_HELPER" ]]; then
    return 1
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    return 1
  fi
  python3 "$DEPLOY_HELPER" "$@"
}

# Commit and push changes to GitHub, then trigger downstream syncs.
push_latest() {
  git add -A
  git commit -m "${COMMIT_MSG:-chore: codex sync}" || true
  git push origin "${BRANCH}"
  # Trigger CI/CD pipeline and connector webhooks
  sync_connectors
  deploy
}

# Pull from GitHub and deploy to droplet.
refresh() {
  git pull --rebase origin "${BRANCH}"
  deploy
}

# Rebase current branch onto main, push, and deploy.
rebase_branch() {
  git fetch origin
  git rebase origin/main
  git push --force-with-lease origin "$(git rev-parse --abbrev-ref HEAD)"
  deploy
}

# Placeholder for external connector synchronization.
sync_connectors() {
  if run_deploy_helper sync; then
    return 0
  fi
  echo "Syncing Salesforce, Airtable, Slack, and Linear..."
  echo "(codex-sync helper: improved_blackroad_deploy.py not found; placeholder executed)"
  # TODO: implement OAuth flows and webhook listeners
  return 0
}

# Placeholder deployment to droplet.
deploy() {
  if run_deploy_helper deploy; then
    return 0
  fi
  echo "Deploying to droplet..."
  echo "(codex-sync helper: improved_blackroad_deploy.py not found; placeholder executed)"
  # TODO: ssh into droplet, run migrations, restart services
  return 0
}

case "${1:-}" in
  push)
    push_latest
    ;;
  refresh)
    refresh
    ;;
  rebase)
    rebase_branch
    ;;
  sync)
    sync_connectors
    ;;
  *)
    echo "Usage: $0 {push|refresh|rebase|sync}"
    ;;
esac

