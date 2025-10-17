#!/usr/bin/env bash
set -euo pipefail

BASE=/srv/blackroad
WRK="$BASE/work"
LOG="$BASE/health/logs"
STATE="$BASE/health/state"
PINFILE="$STATE/known_good.txt"

mkdir -p "$LOG" "$STATE"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

[[ -f "$PINFILE" ]] || exit 0

while read -r REPO COMMIT SVC; do
  [[ -z "$REPO" || "$REPO" =~ ^# ]] && continue
  if [[ -d "$WRK/$REPO/.git" ]]; then
    echo "$(ts) rolling $REPO to $COMMIT"
    git -C "$WRK/$REPO" fetch -q origin || true
    git -C "$WRK/$REPO" reset --hard "$COMMIT" >>"$LOG/heal.log" 2>&1 || true
    if [[ -n "${SVC:-}" ]]; then
      systemctl restart "$SVC" >>"$LOG/heal.log" 2>&1 || true
    fi
    echo "$(ts) rolled $REPO to $COMMIT" >>"$LOG/events.log"
  else
    echo "$(ts) missing repo $REPO for rollback" >>"$LOG/events.log"
  fi
done <"$PINFILE"
