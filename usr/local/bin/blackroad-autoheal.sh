#!/usr/bin/env bash
set -euo pipefail
LOG=/var/log/blackroad-autoheal.log
mkdir -p "$(dirname "$LOG")"
touch "$LOG"; chmod 644 "$LOG"

log(){ echo "$(date -Is) $1" >> "$LOG"; }

check(){
  local name=$1 url=$2 restart=$3 reinstall=$4
  if curl -fsS "$url" >/dev/null; then
    log "OK   $name"
  else
    log "FAIL $name"
    systemctl restart "$restart" || true
    eval "$reinstall" || true
  fi
}

# Service checks
check "spa"  "https://blackroad.io/health"           "nginx"           ""
check "api"  "http://127.0.0.1:4000/api/health"      "blackroad-api"   "npm install --prefix /srv/blackroad-api"
check "llm"  "http://127.0.0.1:8000/health"          "lucidia-llm"     "pip install -r /srv/lucidia-llm/requirements.txt"
check "math" "http://127.0.0.1:8500/health"          "lucidia-math"    "pip install -r /srv/lucidia-math/requirements.txt"

# Nightly update and backup at 02:00
if [ "$(date +%H%M)" = "0200" ]; then
  git -C /srv/blackroad pull --ff-only origin main || true
  npm --prefix /var/www/blackroad install && npm --prefix /var/www/blackroad run build || true
  /usr/local/bin/blackroad-backup.sh || true
fi

# Escalation: 3+ fails in last 10 entries
if [ $(tail -n 10 "$LOG" | grep -c FAIL || true) -ge 3 ]; then
  log "ESCALATE"
fi
