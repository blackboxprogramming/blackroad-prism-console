# FILE: /srv/blackroad-api/scripts/deploy.sh
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/var/log/blackroad-api"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy.log"

exec >>"$LOG_FILE" 2>&1
echo "---- Deploy started at $(date -Is) ----"

# Example: pull latest, install, restart
if [ -d /srv/blackroad-api/.git ]; then
  cd /srv/blackroad-api
  git pull --rebase || true
  npm ci || npm install
fi

# Restart service if present
if systemctl is-enabled --quiet blackroad-api; then
  systemctl restart blackroad-api
fi

echo "---- Deploy finished at $(date -Is) ----"
