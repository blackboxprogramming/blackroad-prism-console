#!/usr/bin/env bash
set -euo pipefail
DIFF_CONTEXT="${1:-diff.patch}"
PATCH_JSON="${2:-review.json}"
jq -r '.suggested_patches // empty' "$PATCH_JSON" > ai.patch || { echo "No patches."; exit 0; }
git apply --index ai.patch && echo "Applied AI patch." || { echo "Patch failed."; exit 1; }
