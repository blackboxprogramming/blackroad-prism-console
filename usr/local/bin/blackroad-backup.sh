#!/usr/bin/env bash
set -e

DEST=/var/backups/blackroad
mkdir -p "$DEST"/daily "$DEST"/weekly "$DEST"/monthly
TS=$(date +%Y-%m-%d)
ARCHIVE="$DEST/daily/backup-$TS.tgz"

tar -czf "$ARCHIVE" /srv/blackroad-api/blackroad.db /srv/lucidia-math/output/

# rotate daily: keep 7
ls -1t "$DEST/daily"/backup-*.tgz 2>/dev/null | tail -n +8 | xargs -r rm --

# weekly on Sunday (1=Mon..7=Sun)
if [ "$(date +%u)" -eq 7 ]; then
  cp "$ARCHIVE" "$DEST/weekly/backup-$TS.tgz"
  ls -1t "$DEST/weekly"/backup-*.tgz 2>/dev/null | tail -n +5 | xargs -r rm --
fi

# monthly on first day
if [ "$(date +%d)" -eq 01 ]; then
  cp "$ARCHIVE" "$DEST/monthly/backup-$TS.tgz"
  ls -1t "$DEST/monthly"/backup-*.tgz 2>/dev/null | tail -n +7 | xargs -r rm --
fi
