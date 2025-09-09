#!/bin/bash
DIR=/srv/blackroad-backups
latest=$(ls -1t $DIR/snapshot-*.tar.gz 2>/dev/null | head -n1)
if [ -z "$latest" ]; then
echo "no snapshot"; exit 1;fi
cat <<MSG
Will restore $latest
Type YES to proceed:
MSG
read ans
if [ "$ans" != "YES" ]; then
echo "aborted"; exit 1;fi
sudo tar -xzf "$latest" -C /
sudo systemctl daemon-reload || true
sudo systemctl restart nginx || true
sudo systemctl restart ollama-bridge.service || true
sudo systemctl restart blackroad-api.service || true
