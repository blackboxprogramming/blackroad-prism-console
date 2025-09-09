#!/usr/bin/env bash
# Create a PR by copying a directory tree into the repo, committing on a new branch, pushing, opening PR.
# Usage: OWNER=org REPO=repo BRANCH=feature/name TITLE="My PR" SRC=/path/to/files ./gh_pr_from_dir.sh
set -euo pipefail
: "${OWNER:?Set OWNER}"; : "${REPO:?Set REPO}"; : "${BRANCH:?Set BRANCH}"; : "${TITLE:?Set TITLE}"; : "${SRC:?Set SRC dir}"
BASE="${BASE:-main}"
WORK="${WORK:-/tmp/pr-work-$RANDOM}"
echo "[*] Cloning $OWNER/$REPO ..."
rm -rf "$WORK"; git clone --depth=1 "https://github.com/$OWNER/$REPO.git" "$WORK"
cd "$WORK"
git switch -c "$BRANCH"
rsync -a --delete "$SRC"/ .
git add -A
git -c user.name="Codex Relay" -c user.email="codex@local" commit -m "$TITLE" || { echo "No changes?"; exit 0; }
git push -u origin "$BRANCH"
gh pr create --title "$TITLE" --body "Automated PR created from $SRC" --base "$BASE" --head "$BRANCH"
