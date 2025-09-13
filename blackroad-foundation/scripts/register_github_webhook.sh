#!/usr/bin/env bash
set -e
REPO="$1"
curl -H "Authorization: token $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/${REPO}/hooks \
  -d '{"config":{"url":"https://blackroad.io/webhooks/matomo","content_type":"json"},"events":["push","issues","pull_request"]}'
