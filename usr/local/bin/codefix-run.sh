#!/bin/bash
set -euo pipefail

REPO="$1"
ISSUE="$2"
DRY_RUN="${3:-}"
WORKDIR=$(mktemp -d)
LOGPREFIX="[codefix]"

echo "$LOGPREFIX cloning $REPO to $WORKDIR"
cd "$WORKDIR"

git clone "https://github.com/$REPO.git" repo
cd repo

BRANCH="codefix/$ISSUE-$(date +%s)"

git checkout -b "$BRANCH"

if npm run lint >/tmp/lint.log 2>&1 && npm test >/tmp/test.log 2>&1; then
  echo "$LOGPREFIX no issues detected"
  exit 0
fi

ERRORS=$(cat /tmp/lint.log /tmp/test.log 2>/dev/null)

echo "$LOGPREFIX requesting patch from LLM"
PATCH=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"errors\": \"$ERRORS\"}" "${LLM_URL:-http://127.0.0.1:8000/generate}")

echo "$PATCH" | git apply --reject --whitespace=fix

git commit -am "chore: codefix for issue #$ISSUE"

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "$LOGPREFIX dry run - skipping push and PR"
  exit 0
fi

git push origin "$BRANCH"

curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -d "{\"title\": \"Codefix for issue #$ISSUE\", \"head\": \"$BRANCH\", \"base\": \"main\"}" \
  "https://api.github.com/repos/$REPO/pulls"

echo "$LOGPREFIX job complete"
