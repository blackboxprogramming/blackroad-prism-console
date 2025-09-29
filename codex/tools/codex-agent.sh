#!/usr/bin/env bash
# codex-agent.sh — watches for "next" trigger and executes remediation workflow.
# See codex/README.md for usage details.

set -euo pipefail

# Configuration: override via environment variables before launching.
PINGBACK_URL="${PINGBACK_URL:-}"          # Endpoint to receive POST callbacks.
STATE_FILE="${STATE_FILE:-/tmp/codex_agent_state}"
LOG_FILE="${LOG_FILE:-/tmp/codex_agent.log}"
NEXT_TOKEN="${NEXT_TOKEN:-next}"
DIAG_ROOT="${DIAG_ROOT:-/tmp}"
REBOOT_ON_TRIGGER="${REBOOT_ON_TRIGGER:-true}"
MAX_DIAG_LINES="${MAX_DIAG_LINES:-100}"
SLEEP_SECONDS="${SLEEP_SECONDS:-1}"

log() {
  local timestamp
  timestamp="$(date +'%Y-%m-%d %H:%M:%S%z')"
  echo "[$timestamp] $*" | tee -a "$LOG_FILE"
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "Required command '$cmd' not found. Install it and restart the agent."
    return 1
  fi
}

append_if_missing() {
  local key="$1"
  local value="$2"
  local target="$3"
  if ! sudo grep -q "^${key}=" "$target" 2>/dev/null; then
    printf '%s\n' "${key}=${value}" | sudo tee -a "$target" >/dev/null
    log "Appended ${key}=${value} to $target"
  else
    log "${key} already present in $target"
  fi
}

prepare_environment() {
  : "${STATE_FILE:?}"
  : "${LOG_FILE:?}"
  mkdir -p "$(dirname "$STATE_FILE")" "$(dirname "$LOG_FILE")"
  touch "$STATE_FILE" "$LOG_FILE"

  require_command curl || exit 1
  require_command date || exit 1
  require_command grep || exit 1
  require_command sed || exit 1
  require_command tee || exit 1
  command -v python3 >/dev/null 2>&1 || log "python3 not found; falling back to minimal JSON builder"
}

collect_diagnostics() {
  local diag_dir
  diag_dir="$(mktemp -d "$DIAG_ROOT/codex_agent_diag_XXXXXXXX")"
  local diag_file="$diag_dir/diagnostics.txt"

  log "Collecting diagnostics to $diag_file"
  {
    echo "=== timestamp ==="
    date --iso-8601=seconds
    echo
    echo "=== uname -a ==="
    uname -a || true
    echo
    echo "=== vcgencmd get_config int ==="
    vcgencmd get_config int 2>&1 || true
    echo
    echo "=== lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT ==="
    lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT || true
    echo
    echo "=== vcgencmd measure_volts ==="
    vcgencmd measure_volts 2>&1 || true
  } >"$diag_file"

  echo "$diag_file"
}

patch_config_txt() {
  local boot
  if mountpoint -q /boot; then
    boot=/boot
  elif mountpoint -q /boot/firmware; then
    boot=/boot/firmware
  else
    boot=/boot
  fi

  local cfg="$boot/config.txt"
  log "Ensuring $cfg has safe fallback options"

  if [ -f "$cfg" ]; then
    sudo cp -n "$cfg" "$cfg.bak_codex" || true
    append_if_missing "usb_max_current_enable" "1" "$cfg"
    append_if_missing "hdmi_safe" "1" "$cfg"
    append_if_missing "hdmi_force_hotplug" "1" "$cfg"
  else
    log "Warning: $cfg not found; skipping config patch"
  fi
}

build_payload() {
  local diag_file="$1"
  local timestamp
  timestamp="$(date +%Y-%m-%dT%H:%M:%S%z)"

  local diag_snippet
  diag_snippet="$(head -n "$MAX_DIAG_LINES" "$diag_file" | sed 's/"/\\"/g')"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$timestamp" "$diag_snippet" <<'PY'
import json
import sys

ts, diag = sys.argv[1:3]
print(json.dumps({
    "timestamp": ts,
    "diag": diag,
    "action": "next_triggered"
}))
PY
  else
    # Minimal JSON builder without Python; note that diagnostics are already escaped.
    printf '{"timestamp":"%s","diag":"%s","action":"next_triggered"}' \
      "$timestamp" "$diag_snippet"
  fi
}

send_pingback() {
  local diag_file="$1"
  if [ -z "$PINGBACK_URL" ]; then
    log "PINGBACK_URL not set; skipping callback"
    return
  fi

  local payload
  payload="$(build_payload "$diag_file")"
  log "Sending pingback to $PINGBACK_URL"
  if ! curl -fsSL -X POST -H "Content-Type: application/json" --data "$payload" "$PINGBACK_URL"; then
    log "Pingback failed"
  fi
}

handle_trigger() {
  log "Trigger '${NEXT_TOKEN}' detected"
  : >"$STATE_FILE"

  local diag_file
  diag_file="$(collect_diagnostics)"

  patch_config_txt
  send_pingback "$diag_file"

  if [ "$REBOOT_ON_TRIGGER" = "true" ]; then
    log "Rebooting to apply changes"
    sudo reboot
  else
    log "REBOOT_ON_TRIGGER set to false; skipping reboot"
  fi
}

prepare_environment
log "Codex agent started. Monitoring $STATE_FILE for token '${NEXT_TOKEN}'."

while true; do
  if grep -qx "$NEXT_TOKEN" "$STATE_FILE" 2>/dev/null; then
    handle_trigger
  fi
  sleep "$SLEEP_SECONDS"
done

