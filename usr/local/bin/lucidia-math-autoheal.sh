#!/usr/bin/env bash
set -euo pipefail

# Lucidia Infinity Math auto-heal script
SERVICE="lucidia-math"
PORT=8500
ALT_PORT=8600
LOCAL_HEALTH="http://127.0.0.1:${PORT}/health"
PUBLIC_URL="https://blackroad.io/math"
APP_DIR="/srv/lucidia-math"
LOG_DIR="$APP_DIR/output"
LOG_FILE="$LOG_DIR/autoheal.log"
WEBHOOK_URL="${LUCIDIA_AUTOHEAL_WEBHOOK:-}"

log() {
  echo "$(date -Is) $1" >> "$LOG_FILE"
}

# ensure output directories exist with correct permissions
mkdir -p "$LOG_DIR" "$LOG_DIR/logic" "$LOG_DIR/primes" "$LOG_DIR/fractals"
chown -R www-data:www-data "$LOG_DIR" 2>/dev/null || true

repairs=0

# 1. service health
if ! systemctl is-active --quiet "$SERVICE"; then
  systemctl restart "$SERVICE"
  log "AUTO-REPAIR: restarted $SERVICE service"
  repairs=$((repairs+1))
fi

# 1b. local health endpoint
health_resp=$(curl -fsS "$LOCAL_HEALTH" 2>/dev/null || true)
if [[ "$health_resp" != *'"status":"ok"'* ]]; then
  if ss -ltn | grep -q ":$PORT"; then
    sed -i "s/:$PORT/:$ALT_PORT/g" /etc/systemd/system/${SERVICE}.service 2>/dev/null || true
    sed -i "s/$PORT/$ALT_PORT/g" /etc/nginx/sites-enabled/${SERVICE}.conf 2>/dev/null || true
    systemctl daemon-reload
    systemctl restart "$SERVICE"
    nginx -t && systemctl reload nginx
    log "AUTO-REPAIR: port conflict resolved, rebound to $ALT_PORT"
  else
    systemctl restart "$SERVICE"
    log "AUTO-REPAIR: health check failed, service restarted"
  fi
  repairs=$((repairs+1))
fi

# 1c. public URL
status_code=$(curl -fsS -o /dev/null -w "%{http_code}" "$PUBLIC_URL" 2>/dev/null || true)
if [[ "$status_code" != "200" ]]; then
  nginx -t && systemctl reload nginx
  log "AUTO-REPAIR: nginx reloaded for $PUBLIC_URL (status $status_code)"
  if [ -d "$APP_DIR/frontend" ]; then
    if npm --prefix "$APP_DIR/frontend" run build >> "$LOG_FILE" 2>&1; then
      cp "$APP_DIR/frontend/build/index.html" /var/www/blackroad/index.html >> "$LOG_FILE" 2>&1 && \
        log "AUTO-REPAIR: rebuilt frontend"
    else
      log "AUTO-REPAIR: frontend build failed"
    fi
  fi
  repairs=$((repairs+1))
fi

# 2. scan logs for module errors and dependency issues
journalctl -u "$SERVICE" -n 100 --no-pager > "$LOG_DIR/journal.tail" 2>/dev/null || true
if grep -q "ModuleNotFoundError" "$LOG_DIR/journal.tail"; then
  pip install -r "$APP_DIR/requirements.txt" >> "$LOG_FILE" 2>&1 || true
  module=$(grep "ModuleNotFoundError: No module named" "$LOG_DIR/journal.tail" | tail -n1 | awk -F"'" '{print $2}')
  if [[ -n "$module" ]]; then
    touch "$APP_DIR/disabled_$module" && log "AUTO-REPAIR: disabled module $module"
  fi
  systemctl restart "$SERVICE"
  log "AUTO-REPAIR: restarted after installing deps"
  repairs=$((repairs+1))
fi

# Check nginx error log
if tail -n 100 /var/log/nginx/error.log 2>/dev/null | grep -Eq "(404|502)"; then
  nginx -t && systemctl reload nginx
  log "AUTO-REPAIR: nginx reloaded due to proxy errors"
  repairs=$((repairs+1))
fi

# Append logs
journalctl -u "$SERVICE" -n 20 --no-pager >> "$LOG_FILE" 2>/dev/null || true
tail -n 20 /var/log/nginx/error.log >> "$LOG_FILE" 2>/dev/null || true

# Escalation if 3+ repairs in last 10 minutes
recent_repairs=$(awk -v ts="$(date -d '10 minutes ago' +%s)" '{split($1, a, "T"); split(a[2], b, "."); cmd="date -d \""a[1]" "b[1]\" +%s"; cmd | getline t; close(cmd); if (t>=ts && $0 ~ /AUTO-REPAIR/) c++} END{print c+0}' "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$recent_repairs" -ge 3 ]; then
  log "ESCALATION: $recent_repairs auto-repairs in last 10 minutes"
  if [ -n "$WEBHOOK_URL" ]; then
    curl -s -X POST -H 'Content-Type: application/json' -d "{\"content\":\"Lucidia Math autoheal escalation: $recent_repairs repairs\"}" "$WEBHOOK_URL" >/dev/null 2>&1 || true
  fi
fi

exit 0
