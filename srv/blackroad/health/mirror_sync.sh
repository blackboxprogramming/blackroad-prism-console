#!/usr/bin/env bash
set -euo pipefail

REPOS=(
  "git@github.com:blackboxprogramming/blackroad-api.git"
  "git@github.com:blackboxprogramming/lucidia-llm.git"
)

BASE=/srv/blackroad
MIR="$BASE/mirror"
WRK="$BASE/work"
LOG="$BASE/health/logs"

mkdir -p "$MIR" "$WRK" "$LOG"

exec > >(tee -a "$LOG/mirror.log") 2>&1

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

for URL in "${REPOS[@]}"; do
  NAME=$(basename "$URL" .git)

  if [[ ! -d "$MIR/$NAME.git" ]]; then
    echo "$(ts) cloning mirror for $NAME"
    git clone --mirror "$URL" "$MIR/$NAME.git" || true
  else
    echo "$(ts) updating mirror for $NAME"
    git -C "$MIR/$NAME.git" remote update --prune || true
  fi

  if [[ ! -d "$WRK/$NAME/.git" ]]; then
    echo "$(ts) creating worktree for $NAME"
    git clone "$MIR/$NAME.git" "$WRK/$NAME" || true
    git -C "$WRK/$NAME" checkout -q main || git -C "$WRK/$NAME" checkout -q master || true
  else
    echo "$(ts) refreshing worktree for $NAME"
    git -C "$WRK/$NAME" fetch origin || true
  fi

done

msg="$(ts) mirror_sync ok"
echo "$msg"
echo "$msg" >>"$LOG/events.log"
