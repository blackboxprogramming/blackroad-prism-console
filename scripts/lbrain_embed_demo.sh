<!-- FILE: /srv/blackroad-api/scripts/lbrain_embed_demo.sh -->
#!/bin/sh
set -e
base="http://127.0.0.1:4000/api/lucidia/brain"
SID=$(curl -sS -X POST "$base/session" -H 'Content-Type: application/json' -d '{}' | jq -r '.session_id')
curl -sS -X POST "$base/message" -H 'Content-Type: application/json' -d "{\"session_id\":$SID,\"content\":\"store fact\"}"
# attempt retrieval
curl -sS "$base/contradictions?session_id=$SID"
