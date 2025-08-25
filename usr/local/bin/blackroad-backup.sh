#!/usr/bin/env bash
set -euo pipefail
DEST=/backups
mkdir -p "$DEST/daily" "$DEST/weekly" "$DEST/monthly"

stamp=$(date +%F)
cp /srv/blackroad-api/blackroad.db "$DEST/daily/blackroad.db.$stamp"
rsync -a /srv/lucidia-math/output/ "$DEST/daily/math-$stamp/"

# rotation
ls -1t "$DEST/daily" | tail -n +8 | xargs -r -I{} rm -rf "$DEST/daily/{}"
if [ "$(date +%u)" = 7 ]; then
  tar -czf "$DEST/weekly/backup-$stamp.tgz" -C "$DEST/daily" .
  ls -1t "$DEST/weekly" | tail -n +5 | xargs -r rm -f
fi
if [ "$(date +%d)" = 01 ]; then
  tar -czf "$DEST/monthly/backup-$stamp.tgz" -C "$DEST/daily" .
  ls -1t "$DEST/monthly" | tail -n +7 | xargs -r rm -f
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
