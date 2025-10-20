#!/usr/bin/env bash
# Usage: GH_PAT=xxxx OWNER=blackboxprogramming REPO=blackroad-prism-console PR=123 pr_lightshow.sh
set -euo pipefail
: "${GH_PAT:?}"; : "${OWNER:?}"; : "${REPO:?}"; : "${PR:?}"
API="https://api.github.com/repos/$OWNER/$REPO/pulls/$PR/files"
diff=$(curl -fsSL -H "Authorization: token $GH_PAT" "$API" \
  | jq 'reduce .[] as $f ({A:0,D:0}; .A += ($f.additions // 0) | .D += ($f.deletions // 0))')
A=$(echo "$diff" | jq -r '.A // 0'); D=$(echo "$diff" | jq -r '.D // 0')
diff=$(curl -fsSL -H "Authorization: token $GH_PAT" "$API" | jq '[.[]|{a:.additions,d:.deletions}]'
      | jq '[.[]|.a] | add as $A | input | [.[].d] | add as $D | {"A":$A,"D":$D}' --slurpfile input <(curl -fsSL -H "Authorization: token $GH_PAT" "$API"))
A=$(echo "$diff" | jq -r '.[0].A//0'); D=$(echo "$diff" | jq -r '.[0].D//0')
KEY="$(sudo cat /srv/secrets/origin.key 2>/dev/null || true)"
pulse(){ curl -s -H "X-BlackRoad-Key: $KEY" -H 'content-type: application/json' \
  -d "{\"type\":\"led.emotion\",\"emotion\":\"$1\",\"ttl_s\":$2}" http://127.0.0.1:4000/api/devices/pi-01/command >/dev/null || true; }
bar(){ pct="$1"; curl -s -H "X-BlackRoad-Key: $KEY" -H 'content-type: application/json' \
  -d "{\"type\":\"led.progress\",\"pct\":$pct,\"ttl_s\":15}" http://127.0.0.1:4000/api/devices/pi-01/command >/dev/null || true; }

# intro
pulse busy 6
# additions sweep
steps=$(( A>0 ? (A/8+1) : 1 )); for i in $(seq 0 8); do bar $(( i*12 )); sleep 0.25; done
# deletions warning pulse
if [ "$D" -gt 0 ]; then pulse error 4; fi
# close
pulse thinking 4
