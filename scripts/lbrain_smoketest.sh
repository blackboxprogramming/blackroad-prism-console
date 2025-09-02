<!-- FILE: /srv/blackroad-api/scripts/lbrain_smoketest.sh -->
#!/bin/sh
set -e
base="http://127.0.0.1:4000/api/lucidia/brain"
echo "-- health --"
curl -sS "$base/health"
echo "\n-- create session --"
SID=$(curl -sS -X POST "$base/session" -H 'Content-Type: application/json' -d '{}' | jq -r '.session_id')
echo "session $SID"
echo "-- post message --"
curl -sS -X POST "$base/message" -H 'Content-Type: application/json' -d "{\"session_id\":$SID,\"content\":\"ping\"}"
echo "\n-- contradictions --"
curl -sS "$base/contradictions?session_id=$SID"
