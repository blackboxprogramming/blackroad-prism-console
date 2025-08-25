#!/usr/bin/env bash
set -euo pipefail
OUTPUT=/var/log/blackroad-validate.json
touch "$OUTPUT"; chmod 644 "$OUTPUT"

timestamp=$(date -Is)

# frontend health
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://blackroad.io/health || echo "000")
if [ "$frontend_status" = "200" ]; then
  frontend="OK"
else
  frontend="FAIL"
fi

# backend api health
api_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/health || echo "000")
api_active=$(systemctl is-active blackroad-api >/dev/null 2>&1 && echo "active" || echo "inactive")
if [ "$api_status" = "200" ] && [ "$api_active" = "active" ]; then
  api="OK"
else
  api="FAIL"
fi

# lucidia llm health
llm_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || echo "000")
llm_active=$(systemctl is-active lucidia-llm >/dev/null 2>&1 && echo "active" || echo "inactive")
if [ "$llm_status" = "200" ] && [ "$llm_active" = "active" ]; then
  llm="OK"
else
  llm="FAIL"
fi

# lucidia math health
math_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8500/health || echo "000")
math_active=$(systemctl is-active lucidia-math >/dev/null 2>&1 && echo "active" || echo "inactive")
if [ "$math_status" = "200" ] && [ "$math_active" = "active" ]; then
  math="OK"
else
  math="FAIL"
fi

# gather logs
logs_api=$(journalctl -u blackroad-api -n 20 --no-pager 2>&1 || true)
logs_llm=$(journalctl -u lucidia-llm -n 20 --no-pager 2>&1 || true)
logs_math=$(journalctl -u lucidia-math -n 20 --no-pager 2>&1 || true)
logs_nginx=$(tail -n 20 /var/log/nginx/error.log 2>/dev/null || true)
logs_autoheal=$(tail -n 20 /var/log/blackroad-autoheal.log 2>/dev/null || true)

# contradiction log
contradict_log=/srv/lucidia-math/output/contradictions/contradiction_log.json
if [ -f "$contradict_log" ]; then
  latest_contradiction=$(jq -c '.[-1]' "$contradict_log" 2>/dev/null || echo "")
else
  latest_contradiction=""
fi

# escalation: count failures in last 10 minutes
now=$(date +%s)
fails_last10=0
if [ -f "$OUTPUT" ]; then
  fails_last10=$(tail -n 100 "$OUTPUT" | jq -s --arg now "$now" '[.[] | select((.timestamp|fromdateiso8601) > (($now|tonumber) - 600)) | select(.frontend=="FAIL" or .api=="FAIL" or .llm=="FAIL" or .math=="FAIL")] | length' 2>/dev/null || echo 0)
fi
if [ "$fails_last10" -ge 3 ]; then
  escalation=true
else
  escalation=false
fi

# build json output
jq -n \
  --arg timestamp "$timestamp" \
  --arg frontend "$frontend" \
  --arg api "$api" \
  --arg llm "$llm" \
  --arg math "$math" \
  --arg logs_api "$logs_api" \
  --arg logs_llm "$logs_llm" \
  --arg logs_math "$logs_math" \
  --arg logs_nginx "$logs_nginx" \
  --arg logs_autoheal "$logs_autoheal" \
  --argjson contradiction "${latest_contradiction:-null}" \
  --argjson escalation "$escalation" \
  '{
    timestamp: $timestamp,
    frontend: $frontend,
    api: $api,
    llm: $llm,
    math: $math,
    contradictions: (if $contradiction == null then [] else [$contradiction] end),
    logs: {
      api: $logs_api,
      llm: $logs_llm,
      math: $logs_math,
      nginx: $logs_nginx,
      autoheal: $logs_autoheal
    },
    escalation: $escalation
  }' | tee -a "$OUTPUT"

# optional webhook
if [ -n "${WEBHOOK_URL:-}" ]; then
  tail -n 1 "$OUTPUT" | curl -s -X POST -H 'Content-Type: application/json' -d @- "$WEBHOOK_URL" >/dev/null || true
fi
