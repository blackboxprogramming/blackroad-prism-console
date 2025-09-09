#!/usr/bin/env bash
set -euo pipefail
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PLAN="$DIR/../../../merge_plan.json"

jq -c '.queue[]' "$PLAN" | while read -r item; do
  pr=$(echo "$item" | jq -r '.number')
  branch=$(echo "$item" | jq -r '.branch')
  impacts=$(echo "$item" | jq -c '.impacts')
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    echo "Would merge PR #$pr ($branch)"
  else
    git fetch origin pull/$pr/head:$branch
    git merge --ff-only $branch
    systemctl daemon-reload
  fi
  for svc in yjs api bridge jsond; do
    if echo "$impacts" | jq -e --arg s "$svc" 'index($s)' >/dev/null; then
      cmd="systemctl restart ${svc}-server"
      [[ "$svc" == "api" ]] && cmd="systemctl restart blackroad-api"
      [[ "$svc" == "bridge" ]] && cmd="systemctl restart ollama-bridge"
      [[ "$svc" == "jsond" ]] && cmd="systemctl restart br-jsond"
      if [[ "${DRY_RUN:-0}" == "1" ]]; then
        echo "Would $cmd"
      else
        $cmd
      fi
    fi
  done
  if echo "$impacts" | jq -e 'index("nginx")' >/dev/null; then
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
      echo "Would nginx -t && systemctl reload nginx"
    else
      nginx -t && systemctl reload nginx
    fi
  fi
  if echo "$impacts" | jq -e 'index("ui")' >/dev/null; then
    echo "UI changes present; deploy static assets as needed"
  fi
  echo "Completed PR #$pr"
  echo
  sleep 1
  done
