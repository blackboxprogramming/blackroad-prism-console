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

# Commit and push changes to GitHub, then trigger downstream syncs.
push_latest() {
  git add -A
  git commit -m "${COMMIT_MSG:-chore: codex sync}" || true
  git push origin "${BRANCH}"
  # TODO: trigger CI/CD pipeline and connector webhooks
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
  echo "Syncing Salesforce, Airtable, Slack, and Linear..."
  # TODO: implement OAuth flows and webhook listeners
}

# Placeholder deployment to droplet.
deploy() {
  echo "Deploying to droplet..."
  # TODO: ssh into droplet, run migrations, restart services
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

