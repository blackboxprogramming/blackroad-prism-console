#!/usr/bin/env bash
set -euo pipefail
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  if [[ -x /srv/blackroad-backups/rollback_latest.sh ]]; then
    echo "Would run /srv/blackroad-backups/rollback_latest.sh"
  else
    echo "Would git revert HEAD"
  fi
  exit 0
fi
if [[ -x /srv/blackroad-backups/rollback_latest.sh ]]; then
  /srv/blackroad-backups/rollback_latest.sh
else
  git revert --no-edit HEAD
fi
