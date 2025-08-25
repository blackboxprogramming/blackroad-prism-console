#!/usr/bin/env bash
# Self-managing deployment + repair framework for BlackRoad.io
# Monitors services, auto-repairs, updates, and manages backups.
set -euo pipefail

LOG_FILE="/var/log/blackroad-autoheal.log"
STATE_FILE="/var/log/blackroad-autoheal.state"
BACKUP_ROOT="/var/backups"

API_DIR="/srv/blackroad-api"
LLM_DIR="/srv/lucidia-llm"
MATH_DIR="/srv/lucidia-math"
SPA_DIR="/var/www/blackroad"
REPO="/srv/blackroad-api"  # main repo

log(){
  echo "$(date -Is) $1" | tee -a "$LOG_FILE"
}

curl_check(){
  curl -fsS "$1" >/dev/null
}

restart_service(){
  systemctl restart "$1" && log "Restarted $1"
}

find_free_port(){
  local port=$1
  while ss -ltn | awk '{print $4}' | grep -q ":$port"; do
    port=$((port+1))
  done
  echo "$port"
}

update_nginx_port(){
  local label=$1 port=$2
  sed -i "s/127\.0\.0\.1:[0-9]\+/127.0.0.1:${port}/" /etc/nginx/sites-enabled/blackroad.conf
  nginx -t && systemctl reload nginx && log "Rebound $label to port $port"
}

rebuild_frontend(){
  if [ ! -f "$SPA_DIR/index.html" ]; then
    log "Frontend build missing; rebuilding"
    (cd "$REPO" && npm --prefix sites/blackroad run build && cp -r sites/blackroad/dist/* "$SPA_DIR"/)
  fi
}

install_api_deps(){ (cd "$API_DIR" && npm install) }
install_llm_deps(){ (cd "$LLM_DIR" && pip install -r requirements.txt) }
install_math_deps(){ (cd "$MATH_DIR" && pip install -r requirements.txt) }

perform_backup(){
  mkdir -p "$BACKUP_ROOT/blackroad" "$BACKUP_ROOT/lucidia-math"
  local ts=$(date +%Y%m%d)
  tar -czf "$BACKUP_ROOT/blackroad/blackroad.db-$ts.tar.gz" -C "$API_DIR" blackroad.db
  tar -czf "$BACKUP_ROOT/lucidia-math/output-$ts.tar.gz" -C "$MATH_DIR" output
  log "Backup completed for $ts"
  rotate_keep "$BACKUP_ROOT/blackroad" 7
  rotate_keep "$BACKUP_ROOT/lucidia-math" 7
}

rotate_keep(){
  local dir=$1 keep=$2
  ls -1t "$dir" | tail -n +$((keep+1)) | xargs -r -I{} rm "$dir/{}"
}

trigger_rollback(){
  local latest
  latest=$(ls -1t "$BACKUP_ROOT/blackroad"/* 2>/dev/null | head -n1 || true)
  if [ -z "$latest" ]; then
    log "No snapshots found; rollback skipped"
    return 1
  fi
  if [ -x "$REPO/scripts/rollback.sh" ]; then
    SNAPSHOT_FILE="$latest" DB_PATH="$API_DIR/blackroad.db" "$REPO/scripts/rollback.sh" || log "Rollback script failed"
  else
    log "Rollback script not found"
  fi
}

update_repo(){
  if git -C "$REPO" pull --rebase; then
    (cd "$API_DIR" && npm install)
    (cd "$LLM_DIR" && pip install -r requirements.txt)
    (cd "$REPO" && npm --prefix sites/blackroad run build)
    restart_service blackroad-api.service
    restart_service lucidia-llm.service
    restart_service lucidia-math.service
  else
    log "Git pull encountered merge conflict; deployment skipped"
  fi
}

update_failure_state(){
  local now=$(date +%s)
  local count=0 last=0
  if [ -f "$STATE_FILE" ]; then
    read count last <"$STATE_FILE"
  fi
  if (( now - last > 600 )); then count=0; fi
  count=$((count+1))
  echo "$count $now" >"$STATE_FILE"
  if (( count >= 3 )); then
    log "Escalation: $count failures in 10 minutes"
    log "See rollback test workflow: https://github.com/blackroad-io/prism-console/actions/workflows/rollback-tests.yml"
    trigger_rollback
  fi
}

check_all(){
  local failures=0
  curl_check https://blackroad.io/health || { log "Frontend check failed"; rebuild_frontend; failures=$((failures+1)); }
  curl_check http://127.0.0.1:4000/api/health || { log "API check failed"; restart_service blackroad-api.service; install_api_deps; failures=$((failures+1)); }
  curl_check http://127.0.0.1:8000/health || { log "LLM check failed"; restart_service lucidia-llm.service; install_llm_deps; failures=$((failures+1)); }
  curl_check http://127.0.0.1:8500/health || { log "Math check failed"; restart_service lucidia-math.service; install_math_deps; failures=$((failures+1)); }
  if (( failures > 0 )); then update_failure_state; fi
}

validate(){
  systemctl is-active blackroad-api.service lucidia-llm.service lucidia-math.service >/dev/null && log "Services active"
  curl_check http://127.0.0.1:4000/api/health
  curl_check http://127.0.0.1:8000/health
  curl_check http://127.0.0.1:8500/health
  local t=$(curl -o /dev/null -s -w "%{time_total}" https://blackroad.io/)
  log "Frontend load time ${t}s"
  curl -s http://127.0.0.1:8000/health > /var/log/blackroad-llm-proof.log || true
}

case "${1:-run}" in
  backup)
    perform_backup
    ;;
  update)
    update_repo
    ;;
  run|*)
    check_all
    validate
    ;;
esac
