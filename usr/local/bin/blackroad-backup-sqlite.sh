#!/bin/bash
set -euo pipefail
SRC="/srv/blackroad-api/blackroad.db"
DEST="/var/backups/blackroad/sqlite"
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M%S)
if [ -f "$SRC" ]; then
  gzip -c "$SRC" > "$DEST/$STAMP.sqlite.gz"
  find "$DEST" -type f -mtime +14 -delete
fi
