#!/usr/bin/env bash
set -euo pipefail
. /opt/blackroad/os/upgrade/helpers.sh

TARGET="$(last_good)"
if [[ "$TARGET" == "none" ]]; then
  echo "No last-good recorded. Nothing to rollback to."
  exit 1
fi

echo "Rolling back to $TARGET ..."
git -C "$ROOT" fetch --tags --force
git -C "$ROOT" checkout -f "$TARGET"

echo "Rebuilding/Restarting stack..."
dc down
dc up -d --remove-orphans

echo "Health gate..."
/opt/blackroad/os/upgrade/health_gate.sh
echo "Rollback complete. Running version: $(current_tag)"
