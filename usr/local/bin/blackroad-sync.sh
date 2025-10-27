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
