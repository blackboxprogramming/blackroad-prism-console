#!/usr/bin/env bash

set -euo pipefail

# Branch Cleanup Script
# Deletes merged branches from the remote repository. When invoked from CI set
# AUTO_APPROVE=true and provide an auth token (via GH_TOKEN or GITHUB_TOKEN)
# capable of deleting remote branches.

REMOTE=${REMOTE:-origin}
BASE_BRANCH=${BASE_BRANCH:-${REMOTE}/main}
PROTECTED_BRANCHES=${PROTECTED_BRANCHES:-"main staging production develop release/*"}
AUTO_APPROVE=${AUTO_APPROVE:-${CI:-false}}

echo "=== Dead Branch Cleanup Script ==="
echo "Remote: $REMOTE"
echo "Base for merge detection: $BASE_BRANCH"

git fetch "$REMOTE" --prune

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  echo "Base branch $BASE_BRANCH not found; nothing to do." >&2
  exit 0
fi

mapfile -t BRANCHES < <(
  git for-each-ref --format='%(refname:strip=2)' "refs/remotes/${REMOTE}" \
    --merged "$BASE_BRANCH" | sed "s#^${REMOTE}/##" | sort -u
)

FILTERED=()
for branch in "${BRANCHES[@]}"; do
  [ -z "$branch" ] && continue
  [ "$branch" = "HEAD" ] && continue

  skip=false
  for pattern in $PROTECTED_BRANCHES; do
    if [[ $branch == $pattern ]]; then
      skip=true
      break
    fi
  done

  if [ "$skip" = true ]; then
    continue
  fi

  FILTERED+=("$branch")
done

COUNT=${#FILTERED[@]}

if [ "$COUNT" -eq 0 ]; then
  echo "No merged branches to delete." >&2
  exit 0
fi

echo "Identified $COUNT merged branches eligible for deletion."
if [ "$AUTO_APPROVE" != "true" ]; then
  echo "WARNING: This action cannot be undone!"
  read -rp "Delete the listed branches from $REMOTE? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi
else
  echo "AUTO_APPROVE enabled; proceeding without interactive prompt."
fi

echo ""
echo "Starting branch deletion..."
echo ""

deleted=0
failed=0

for branch in "${FILTERED[@]}"; do
  echo "Deleting: $branch"
  if git push "$REMOTE" --delete "$branch" >/dev/null 2>&1; then
    ((deleted++))
  else
    ((failed++))
    echo "  Failed to delete: $branch" >&2
  fi
done

echo ""
echo "=== Cleanup Complete ==="
echo "Successfully deleted: $deleted branches"
echo "Failed: $failed branches"

if [ "$failed" -gt 0 ]; then
  exit 1
fi

exit 0
