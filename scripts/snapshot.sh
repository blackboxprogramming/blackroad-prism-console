#!/usr/bin/env bash
set -euo pipefail
DB_PATH=${DB_PATH:-/srv/blackroad-api/blackroad.db}
SNAPSHOT_DIR=${SNAPSHOT_DIR:-./snapshots}
mkdir -p "$SNAPSHOT_DIR"
if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH" >&2
  exit 1
fi
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
SNAPSHOT_FILE="$SNAPSHOT_DIR/$(basename "$DB_PATH")-$STAMP"
cp "$DB_PATH" "$SNAPSHOT_FILE"
echo "$SNAPSHOT_FILE" > "$SNAPSHOT_DIR/latest"
echo "$SNAPSHOT_FILE"
