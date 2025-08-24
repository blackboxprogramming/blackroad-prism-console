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
fi
