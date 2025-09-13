#!/usr/bin/env bash
set -euo pipefail
echo "Auto-remediation starting…"
# Example action: restart API remotely
if [ -n "${SSH_PRIVATE_KEY:-}" ]; then
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  printf "%s" "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa
  ssh -o StrictHostKeyChecking=no root@"${DROPLET_HOST}" "pm2 restart blackroad-api || systemctl restart blackroad-api || true"
fi
curl -s -X POST -H 'Content-Type: application/json' -d '{"text":"Auto-remediation executed"}' "${SLACK_WEBHOOK:-}" >/dev/null 2>&1 || true
