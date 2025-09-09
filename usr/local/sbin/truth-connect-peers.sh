#!/usr/bin/env bash
set -euo pipefail
PEERS_FILE="/etc/truth/peers.txt"
if [ ! -f "$PEERS_FILE" ]; then echo "No $PEERS_FILE"; exit 0; fi
while IFS= read -r addr; do
  [ -z "$addr" ] && continue
  ipfs swarm connect "$addr" || true
done < "$PEERS_FILE"
