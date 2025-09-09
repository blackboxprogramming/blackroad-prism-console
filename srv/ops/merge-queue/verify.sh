#!/usr/bin/env bash
set -euo pipefail
: "${BLACKROAD_KEY:?set BLACKROAD_KEY}" > /dev/null

fail=0
run() {
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    echo "$*"
  else
    echo "Running: $*"
    if ! eval "$*"; then
      echo "Command failed: $*" >&2
      fail=1
    fi
  fi
}

run "curl -fsS https://blackroad.io/healthz"
run "curl -fsS http://127.0.0.1:4010/api/llm/health"
run "curl -fsS http://127.0.0.1:12345/yjs/test"
run "test \"$(curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay)\" = 403"
run "curl -fsS -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects"
run "curl -fsS -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices"

exit $fail
