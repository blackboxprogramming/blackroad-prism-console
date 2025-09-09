#!/usr/bin/env bash
# Play a PR's diff as LEDs (blue-ish progress for additions, red pulse if deletions, celebrate if CI green).
# Uses GH_TOKEN (from Actions) or GH_PAT; runs best on a self-hosted runner that can hit 127.0.0.1:4000.
set -euo pipefail
: "${OWNER:?Set OWNER}"; : "${REPO:?Set REPO}"; : "${PR:?Set PR}"
TOKEN="${GH_PAT:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
[ -n "$TOKEN" ] || { echo "Need GH_TOKEN/GH_PAT"; exit 2; }
BASE="${LED_BASE:-http://127.0.0.1:4000}"

api(){ curl -fsSL -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "$@"; }

# Sum additions/deletions (handle pagination)
page=1 A=0 D=0
while :; do
  resp="$(api "https://api.github.com/repos/$OWNER/$REPO/pulls/$PR/files?per_page=100&page=$page")"
  cnt="$(echo "$resp" | jq 'length')"
  [ "$cnt" -eq 0 ] && break
  A=$(( A + $(echo "$resp" | jq '[.[]|.additions]|add // 0') ))
  D=$(( D + $(echo "$resp" | jq '[.[]|.deletions]|add // 0') ))
  page=$((page+1))
done

# Head SHA & combined status for CI celebration
sha="$(api "https://api.github.com/repos/$OWNER/$REPO/pulls/$PR" | jq -r '.head.sha')"
STATE="$(api "https://api.github.com/repos/$OWNER/$REPO/commits/$sha/status" | jq -r '.state')"

# Helpers
progress(){ curl -sS -H 'content-type: application/json' \
  -d "{\"type\":\"led.progress\",\"pct\":$1,\"ttl_s\":8}" "$BASE/api/devices/pi-01/command" >/dev/null || true; }
emo(){ curl -sS -H 'content-type: application/json' \
  -d "{\"type\":\"led.emotion\",\"emotion\":\"$1\",\"ttl_s\":$2}" "$BASE/api/devices/pi-01/command" >/dev/null || true; }

# Intro
emo busy 6

# Map additions to a few progress sweeps (cap for very large PRs)
steps=$(( A>0 ? ( (A>4000 ? 4000 : A) / 8 + 1 ) : 4 ))
for i in $(seq 0 8); do progress $(( i*12 )); sleep 0.22; done
for _ in $(seq 2 $((steps>6?6:steps))); do progress 15; sleep 0.15; progress 60; sleep 0.15; progress 90; sleep 0.15; done

# Deletions pulse
if [ "$D" -gt 0 ]; then emo error 4; fi

# CI celebration if green, else thoughtful blue
if [ "$STATE" = "success" ]; then
  curl -sS -H 'content-type: application/json' -d '{"type":"led.celebrate","ttl_s":12}' \
    "$BASE/api/devices/pi-01/command" >/dev/null || true
else
  emo thinking 6
fi
