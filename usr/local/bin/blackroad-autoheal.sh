#!/usr/bin/env bash
set -e

LOG_FILE=/var/log/blackroad-autoheal.log

echo "$(date --iso-8601=seconds) starting auto-heal check" >> "$LOG_FILE"

check_service() {
  local name="$1"
  local url="$2"

  if ! curl -fsS "$url" > /dev/null; then
    echo "$(date --iso-8601=seconds) $name unhealthy, restarting" >> "$LOG_FILE"
    if ! systemctl restart "$name" >> "$LOG_FILE" 2>&1; then
      echo "$(date --iso-8601=seconds) $name restart failed, installing deps" >> "$LOG_FILE"
      case "$name" in
        blackroad-api)
          (cd /srv/blackroad-api && npm install) >> "$LOG_FILE" 2>&1 ;;
        lucidia-llm)
          (cd /srv/lucidia-llm && pip install -r requirements.txt) >> "$LOG_FILE" 2>&1 ;;
        lucidia-math)
          (cd /srv/lucidia-math && pip install -r requirements.txt) >> "$LOG_FILE" 2>&1 ;;
      esac
      systemctl restart "$name" >> "$LOG_FILE" 2>&1
    fi
  fi
}

check_service blackroad-api https://blackroad.io/health
check_service blackroad-api http://127.0.0.1:4000/api/health
check_service lucidia-llm http://127.0.0.1:8000/health
check_service lucidia-math http://127.0.0.1:8500/health
