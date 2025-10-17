#!/bin/bash
set -e
DIR=/srv/blackroad-backups
mkdir -p "$DIR"
ts=$(date +%Y%m%d-%H%M%S)
file="$DIR/snapshot-$ts.tar.gz"
manifest="$DIR/snapshot-$ts.manifest.json"

tar -czf "$file" \
  /var/www/blackroad/llm.html \
  /srv/ollama-bridge/package.json \
  /srv/ollama-bridge/server.js \
  /etc/systemd/system/ollama-bridge.service \
  /etc/nginx/* 2>/dev/null \
  /srv/blackroad-api/blackroad.db 2>/dev/null

echo "{\"file\":\"$file\",\"time\":\"$(date --iso-8601=seconds)\"}" > "$manifest"

echo $(date '+%Y-%m-%d %H:%M') > "$DIR/.last_snapshot"

ls -1t "$DIR"/snapshot-*.tar.gz | tail -n +8 | xargs -r rm --
