#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
PLIST_SRC="$STACK_DIR/launch_agents/com.blackroad.pi-cortex-agent.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.blackroad.pi-cortex-agent.plist"

mkdir -p "$(dirname "$PLIST_DEST")"
cp "$PLIST_SRC" "$PLIST_DEST"
launchctl unload "$PLIST_DEST" >/dev/null 2>&1 || true
launchctl load "$PLIST_DEST"
echo "Loaded LaunchAgent at $PLIST_DEST"
