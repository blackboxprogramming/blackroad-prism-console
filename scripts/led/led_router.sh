#!/usr/bin/env bash
# Parse a PR comment and route to LED actions.
# Env:
#   GITHUB_COMMENT_BODY, OWNER, REPO, PR
#   LED_BASE (default http://127.0.0.1:4000), LED_KEY (optional)
set -euo pipefail
BODY="$(echo "${GITHUB_COMMENT_BODY:-}" | tr '[:upper:]' '[:lower:]')"
[ -n "$BODY" ] || { echo "no comment body"; exit 0; }
BASE="${LED_BASE:-http://127.0.0.1:4000}"
KEY="${LED_KEY:-}"

say(){ printf '[router] %s\n' "$*"; }

run_notify(){ bash scripts/led/led_notify.sh "$@"; }
post_json(){ 
  hdr=(-H 'content-type: application/json'); [ -n "$KEY" ] && hdr+=(-H "X-BlackRoad-Key: $KEY")
  curl -sS "${hdr[@]}" -d "$1" "$BASE/api/devices/pi-01/command" >/dev/null || true
}

# Map simple "athena <emotion>" and "/led <emotion> [ttl]"
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+ok)($|[[:space:]]) ]];         then run_notify ok 12;        exit 0; fi
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+busy)($|[[:space:]]) ]];       then run_notify busy 15;      exit 0; fi
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+thinking)($|[[:space:]]) ]];   then run_notify thinking 15;  exit 0; fi
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+error)($|[[:space:]]) ]];      then run_notify error 12;     exit 0; fi
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+celebrate)($|[[:space:]]) ]];  then run_notify celebrate 12; exit 0; fi
if [[ "$BODY" =~ (^|[[:space:]])(athena[[:space:]]+help)($|[[:space:]]) ]];       then run_notify help 20;      exit 0; fi

if [[ "$BODY" =~ /led[[:space:]]+([a-z]+)([[:space:]]+([0-9]+))? ]]; then
  emo="${BASH_REMATCH[1]}"; ttl="${BASH_REMATCH[3]:-12}"
  if [[ "$emo" == "progress" ]]; then
    if [[ "$BODY" =~ /led[[:space:]]+progress[[:space:]]+([0-9]{1,3}) ]]; then
      pct="${BASH_REMATCH[1]}"; [ "$pct" -gt 100 ] && pct=100
      post_json "{\"type\":\"led.progress\",\"pct\":$pct,\"ttl_s\":12}"
      exit 0
    fi
  else
    run_notify "$emo" "$ttl"; exit 0
  fi
fi

# Lightshow: "athena play" | "/lightshow" | "/lightshow 123"
if [[ "$BODY" =~ (athena[[:space:]]+play|/lightshow) ]]; then
  if [[ "$BODY" =~ /lightshow[[:space:]]+([0-9]+) ]]; then PR="${BASH_REMATCH[1]}"; fi
  : "${OWNER:?}"; : "${REPO:?}"; : "${PR:?}"
  bash scripts/led/pr_lightshow.sh
  exit 0
fi

say "no recognized command"
exit 0
