#!/bin/bash
set -euo pipefail

DB_PATH=${DB_PATH:-/var/blackroad/blackroad.db}
API_DIR=${API_DIR:-/srv/blackroad-api}
LLM_DIR=${LLM_DIR:-/srv/lucidia-llm}
MATH_DIR=${MATH_DIR:-/srv/lucidia-math}

BACKUP_BASE=${BACKUP_BASE:-/var/backups/prism}
LOG_FILE=${ROLLBACK_LOG:-/var/log/prism-rollback.log}

if [ -n "${1:-}" ]; then
  TS="$1"
else
  echo "Available snapshots:"
  ls "$BACKUP_BASE"
  read -p "Select snapshot: " TS
fi

if [ "$TS" = "latest" ]; then
  TS=$(find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d ! -name weekly | sort | tail -n 1)
fi

SNAP="$BACKUP_BASE/$TS"
if [ ! -d "$SNAP" ]; then
  echo "Snapshot not found: $TS" >&2
  exit 1
fi

gzip -cd "$SNAP/blackroad.db.gz" > "$DB_PATH" 2>/dev/null || true
rsync -a "$SNAP/api/" "$API_DIR/" 2>/dev/null || true
rsync -a "$SNAP/llm/" "$LLM_DIR/" 2>/dev/null || true
rsync -a "$SNAP/math/" "$MATH_DIR/" 2>/dev/null || true

if command -v systemctl >/dev/null 2>&1; then
  systemctl restart blackroad-api lucidia-llm lucidia-math || true
  systemctl reload nginx || systemctl restart nginx || true
fi

mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date --iso-8601=seconds) rollback to $TS" >> "$LOG_FILE"
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
