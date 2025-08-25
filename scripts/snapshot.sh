#!/bin/bash
set -euo pipefail

DB_PATH=${DB_PATH:-/var/blackroad/blackroad.db}
API_DIR=${API_DIR:-/srv/blackroad-api}
LLM_DIR=${LLM_DIR:-/srv/lucidia-llm}
MATH_DIR=${MATH_DIR:-/srv/lucidia-math}

BACKUP_BASE=${BACKUP_BASE:-/var/backups/prism}
LOG_FILE=${SNAPSHOT_LOG:-/var/log/prism-snapshots.log}

TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEST="$BACKUP_BASE/$TIMESTAMP"

mkdir -p "$DEST/api" "$DEST/llm" "$DEST/math"
mkdir -p "$(dirname "$LOG_FILE")"

if [ -f "$DB_PATH" ]; then
  gzip -c "$DB_PATH" > "$DEST/blackroad.db.gz"
fi

rsync -a "$API_DIR/" "$DEST/api/" 2>/dev/null || true
rsync -a "$LLM_DIR/" "$DEST/llm/" 2>/dev/null || true
rsync -a "$MATH_DIR/" "$DEST/math/" 2>/dev/null || true

echo "$(date --iso-8601=seconds) $DEST" >> "$LOG_FILE"

# retain last 7 daily backups
find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d ! -name weekly | sort | head -n -7 | xargs -r rm -rf

# weekly retention - every Sunday copy to weekly folder and keep last 4
if [ "$(date +%u)" -eq 7 ]; then
  WEEKLY="$BACKUP_BASE/weekly"
  mkdir -p "$WEEKLY"
  cp -al "$DEST" "$WEEKLY/$TIMESTAMP"
  find "$WEEKLY" -mindepth 1 -maxdepth 1 -type d | sort | head -n -4 | xargs -r rm -rf
fi
