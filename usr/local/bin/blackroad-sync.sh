#!/bin/bash
# BlackRoad Agent Sync Script — runs on Alice (Pi 400)
# Keeps all nodes in sync with the master GitHub repo

set -euo pipefail

REPO_DIR="/home/pi/blackroad-prism-console"
REGISTRY_FILE="$REPO_DIR/network/registry.json"
REMOTE_REPO="https://github.com/blackboxprogramming/blackroad-prism-console.git"
NODES_FILE="$REPO_DIR/network/nodes.txt" # list of node hostnames or IPs

cd "$REPO_DIR" || exit 1

if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$REMOTE_REPO"
fi

echo "[BlackRoad] Checking for updates..."
git fetch origin main

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "[BlackRoad] New commit found, pulling updates..."
    git pull origin main
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Log update to registry
    if [ -f "$REGISTRY_FILE" ]; then
        jq --arg time "$TIMESTAMP" '.updated = $time' "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
    else
        mkdir -p "$(dirname "$REGISTRY_FILE")"
        printf '{"updated":"%s"}\n' "$TIMESTAMP" > "$REGISTRY_FILE"
    fi

    echo "[BlackRoad] Broadcasting update to nodes..."
    if [ -f "$NODES_FILE" ]; then
        while IFS= read -r NODE; do
            [ -z "$NODE" ] && continue
            case "$NODE" in 
                \#*) continue ;;
            esac
            echo "  → Syncing $NODE"
            ssh pi@"$NODE" "cd $REPO_DIR && git fetch origin main && git reset --hard origin/main && sudo systemctl restart blackroad-agent" &
        done < "$NODES_FILE"
        wait
    else
        echo "[BlackRoad] No nodes file found at $NODES_FILE."
    fi
else
    echo "[BlackRoad] No new updates."
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=${REPO_DIR:-/home/pi/blackroad-prism-console}
REGISTRY_FILE=${REGISTRY_FILE:-$REPO_DIR/network/registry.json}
REPORT_DIR=${REPORT_DIR:-$REPO_DIR/network/reports}
REMOTE_NAME=${REMOTE_NAME:-origin}
REMOTE_BRANCH=${REMOTE_BRANCH:-main}

log() {
  printf '[BlackRoad] %s\n' "$*"
}

cd "$REPO_DIR"

log "Refreshing repository state from ${REMOTE_NAME}/${REMOTE_BRANCH}..."
git fetch "$REMOTE_NAME" "$REMOTE_BRANCH"
git checkout "$REMOTE_BRANCH"
git pull --ff-only "$REMOTE_NAME" "$REMOTE_BRANCH"

log "Merging incoming node reports..."
mkdir -p "$REPORT_DIR"
TMP_REG="$REPO_DIR/network/registry.tmp.json"
trap 'rm -f "$TMP_REG" "$TMP_REG.tmp"' EXIT

jq -n '{network: "blackroad-mesh", nodes: []}' > "$TMP_REG"

shopt -s nullglob
for f in "$REPORT_DIR"/*.json; do
  if jq empty "$f" >/dev/null 2>&1; then
    jq --slurpfile node "$f" '.nodes += $node' "$TMP_REG" > "$TMP_REG.tmp" && mv "$TMP_REG.tmp" "$TMP_REG"
  else
    log "Skipping invalid report: $f"
  fi
done
shopt -u nullglob

jq --arg time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
   '.updated = $time | .nodes |= sort_by(.id)' \
   "$TMP_REG" > "$TMP_REG.tmp"
mv "$TMP_REG.tmp" "$REGISTRY_FILE"

if git diff --quiet -- "$REGISTRY_FILE"; then
  log "Registry unchanged; nothing to commit."
else
  git add "$REGISTRY_FILE"
  git commit -m "update: merged node reports $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  git push "$REMOTE_NAME" "$REMOTE_BRANCH"
fi
