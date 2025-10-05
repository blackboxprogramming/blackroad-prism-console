#!/usr/bin/env bash
set -euo pipefail

BASE=/srv/blackroad
WRK="$BASE/work"
HLT="$BASE/health"
LOG="$HLT/logs"
STATE="$HLT/state"

mkdir -p "$LOG" "$STATE"

exec > >(tee -a "$LOG/health.log") 2>&1

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
ok() { echo "$(ts) OK  $*"; }
bad() {
  local msg="$(ts) BAD $*"
  echo "$msg"
  echo "$msg" >>"$LOG/events.log"
}

WATCH=(
  "blackroad-api|blackroad-api.service|4000|/srv/blackroad-api/.env"
  "lucidia-llm|lucidia-llm.service|8000|/srv/lucidia-llm/.env"
)

changed_env() {
  local file="$1"
  local key="envhash_$(basename "$file")"
  [[ -f "$file" ]] || return 1

  local current previous
  current=$(sha256sum "$file" | awk '{print $1}')
  previous=$(grep -m1 "^$key=" "$STATE/env.hash" 2>/dev/null | cut -d= -f2- || true)

  if [[ "$current" != "$previous" ]]; then
    sed -i "/^$key=/d" "$STATE/env.hash" 2>/dev/null || true
    echo "$key=$current" >>"$STATE/env.hash"
    return 0
  fi

  return 1
}

heal_repo() {
  local repo="$1"
  [[ -d "$WRK/$repo/.git" ]] || return
  git -C "$WRK/$repo" reset --hard HEAD >>"$LOG/heal.log" 2>&1 || true
  git -C "$WRK/$repo" clean -fd >>"$LOG/heal.log" 2>&1 || true
  git -C "$WRK/$repo" pull --ff-only >>"$LOG/heal.log" 2>&1 || true
}

trigger_rollback() {
  local svc="$1" count="$2"
  echo "$(ts) triggering rollback for $svc after $count failures" >>"$LOG/events.log"
  /bin/bash "$HLT/rollback.sh" >>"$LOG/heal.log" 2>&1 || true
}

update_fail_counter() {
  local svc="$1" failed="$2"
  local counter_file="$STATE/fails_${svc//[^A-Za-z0-9_.-]/_}"
  local count=0

  if [[ "$failed" == "1" ]]; then
    if [[ -f "$counter_file" ]]; then
      count=$(<"$counter_file")
    fi
    count=$((count + 1))
    echo "$count" >"$counter_file"
    if (( count >= 3 )); then
      trigger_rollback "$svc" "$count"
      echo 0 >"$counter_file"
    fi
  else
    rm -f "$counter_file" 2>/dev/null || true
  fi
}

for spec in "${WATCH[@]}"; do
  IFS="|" read -r REPO SVC PORT ENVF <<<"$spec"
  service_failed=0

  if [[ -d "$WRK/$REPO/.git" ]]; then
    git -C "$WRK/$REPO" fetch -q origin || true
    local_head=$(git -C "$WRK/$REPO" rev-parse @)
    remote_head=$(git -C "$WRK/$REPO" rev-parse @{u} 2>/dev/null || echo "")
    dirt=$(git -C "$WRK/$REPO" status --porcelain)

    if [[ -n "$dirt" ]] || { [[ -n "$remote_head" ]] && [[ "$local_head" != "$remote_head" ]]; }; then
      bad "$REPO drift detected"
      heal_repo "$REPO"
      service_failed=1
    else
      ok "$REPO clean"
    fi
  else
    bad "$REPO missing working tree"
    service_failed=1
  fi

  if systemctl is-active --quiet "$SVC"; then
    ok "$SVC active"
  else
    bad "$SVC down -> restarting"
    systemctl restart "$SVC" || true
    service_failed=1
  fi

  if ss -ltn | awk '{print $4}' | grep -q ":$PORT$"; then
    ok "port $PORT listening"
  else
    bad "port $PORT not listening -> restart $SVC"
    systemctl restart "$SVC" || true
    service_failed=1
  fi

  if [[ -n "${ENVF:-}" && -f "$ENVF" ]] && changed_env "$ENVF"; then
    bad "env changed for $SVC -> restart"
    systemctl restart "$SVC" || true
    service_failed=1
  fi

  update_fail_counter "$SVC" "$service_failed"
done

echo "$(ts) health_check done" >>"$LOG/events.log"
