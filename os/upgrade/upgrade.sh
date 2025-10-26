#!/usr/bin/env bash
set -euo pipefail
. /opt/blackroad/os/upgrade/helpers.sh

CHANNEL="$(read_channel)"
CURR="$(current_tag)"
[[ "$CURR" == "none" ]] && CURR="$(git -C "$ROOT" rev-parse --short HEAD)"

echo "Channel: $CHANNEL"
git -C "$ROOT" fetch --tags --force

NEXT="$(latest_tag_for_channel "$CHANNEL")"
if [[ -z "$NEXT" ]]; then
  echo "No tags found. Create semver tags (e.g., v0.1.0)."
  exit 1
fi

if [[ "$NEXT" == "$CURR" ]]; then
  echo "Already on latest ($CURR)."
  exit 0
fi

echo "Upgrading: $CURR -> $NEXT"
# record current as rollback point
save_last_good "$CURR"

git -C "$ROOT" checkout -f "$NEXT"

# build (local) or pull (if images pinned). Default: build local
echo "Rebuilding/Restarting stack..."
dc down
dc build --pull
dc up -d --remove-orphans

echo "Health gate..."
if /opt/blackroad/os/upgrade/health_gate.sh; then
  echo "Upgrade OK -> $NEXT"
  save_last_good "$NEXT"
  exit 0
else
  echo "Health gate failed. Rolling back..."
  /opt/blackroad/os/upgrade/rollback.sh || true
  exit 2
fi
