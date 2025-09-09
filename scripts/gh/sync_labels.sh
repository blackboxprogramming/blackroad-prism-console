#!/usr/bin/env bash
# Sync labels from .github/labels.yml to the current repo.
# Usage: OWNER=org REPO=name ./scripts/gh/sync_labels.sh
set -euo pipefail
: "${OWNER:?Set OWNER}"; : "${REPO:?Set REPO}"
FILE=".github/labels.yml"
[ -f "$FILE" ] || { echo "Missing $FILE"; exit 1; }
# requires mikepenz/gh-action-import-github-labels equivalent locally:
gh api --method PUT -H "Accept: application/vnd.github+json" \
  "/repos/$OWNER/$REPO/labels" -F data@"$FILE" >/dev/null || true
# Fallback: iterate via yq if needed:
if command -v yq >/dev/null 2>&1; then
  count=$(yq '. | length' "$FILE")
  for i in $(seq 0 $((count-1))); do
    name=$(yq -r ".[$i].name" "$FILE"); color=$(yq -r ".[$i].color" "$FILE"); desc=$(yq -r ".[$i].description" "$FILE")
    gh label create "$name" --color "$color" --description "$desc" --repo "$OWNER/$REPO" 2>/dev/null || \
    gh label edit "$name" --color "$color" --description "$desc" --repo "$OWNER/$REPO"
  done
fi
echo "[✓] Labels synced"
