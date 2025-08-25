#!/usr/bin/env bash
set -euo pipefail
DB_PATH=${DB_PATH:-/srv/blackroad-api/blackroad.db}
SNAPSHOT_DIR=${SNAPSHOT_DIR:-./snapshots}
SNAPSHOT_FILE=${1:-}
if [ -z "$SNAPSHOT_FILE" ]; then
  if [ ! -f "$SNAPSHOT_DIR/latest" ]; then
    echo "No snapshot found" >&2
    exit 1
  fi
  SNAPSHOT_FILE=$(cat "$SNAPSHOT_DIR/latest")
fi
if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo "Snapshot file missing: $SNAPSHOT_FILE" >&2
  exit 1
fi
cp "$SNAPSHOT_FILE" "$DB_PATH"
echo "Rollback completed from $SNAPSHOT_FILE"
