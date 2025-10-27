#!/usr/bin/env bash
set -euo pipefail

# BlackRoad Node Reporter — runs on every non-Alice device
AGENT_ID=${AGENT_ID:-$(hostname)}
SUPERVISOR=${SUPERVISOR:-alice-pi400.local}
REPO_DIR=${REPO_DIR:-/home/pi/blackroad-prism-console}
REPORT_FILE="${REPORT_FILE:-$REPO_DIR/network/status.json}"
REPORTS_DIR="${REPORTS_DIR:-$REPO_DIR/network/reports}"

mkdir -p "$(dirname "$REPORT_FILE")" "$REPORTS_DIR"

read_cpu_temp() {
  local thermal_path
  for thermal_path in /sys/class/thermal/thermal_zone0/temp /sys/class/hwmon/hwmon*/temp1_input; do
    if [[ -r "$thermal_path" ]]; then
      awk '{print $1/1000}' "$thermal_path" && return 0
    fi
  done
  echo ""
}

CPU_TEMP=$(read_cpu_temp || true)
UPTIME=$(awk '{print int($1/60)}' /proc/uptime 2>/dev/null || echo "")
LOAD=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "")
AGENT_COUNT=$(pgrep -c blackroad-agent 2>/dev/null || echo "0")

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

jq -n \
  --arg id "$AGENT_ID" \
  --arg time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg load "$LOAD" \
  --arg uptime "$UPTIME" \
  --arg temp "$CPU_TEMP" \
  --arg agents "$AGENT_COUNT" \
  '
  def num_or_null($v):
    if ($v | type) == "string" then
      if ($v | test("^\\s*$")) then null else ($v | tonumber) end
    else
      null
    end;
  {
    id: $id,
    updated: $time,
    metrics: {
      load_avg: num_or_null($load),
      uptime_min: num_or_null($uptime),
      cpu_temp_c: num_or_null($temp),
      agents_active: num_or_null($agents)
    }
  }
  ' > "$TMP_FILE"

mv "$TMP_FILE" "$REPORT_FILE"

SUPERVISOR_PATH="pi@${SUPERVISOR}:/home/pi/blackroad-prism-console/network/reports/${AGENT_ID}.json"
if ! scp -q "$REPORT_FILE" "$SUPERVISOR_PATH"; then
  echo "[blackroad-agent-report] WARNING: failed to copy report to supervisor ${SUPERVISOR}" >&2
fi
