#!/usr/bin/env bash
set -euo pipefail

export SYSTEMD_PAGER=""
export SYSTEMD_COLORS="0"

OUT="/var/log/stack_heartbeat.log"
TMP="$(mktemp)"
NOW="$(date -Is)"

{
  echo "=== STACK HEARTBEAT @ ${NOW} ==="
  echo
  echo "## Critical errors since last boot (journalctl -p 3 -xb)"
  journalctl -p 3 -xb --no-pager || true
  echo
  echo "## Failed units (systemctl list-units --failed)"
  systemctl list-units --failed --no-pager || true
  echo
} > "$TMP"

mv "$TMP" "$OUT"
chmod 0644 "$OUT"

if grep -qiE 'error|failed|failure' "$OUT"; then
  # Uncomment the next line after installing and configuring a local MTA
  # mail -s "STACK ALERT: issues detected $(hostname) @ ${NOW}" you@example.com < "$OUT"
  logger -t stack-heartbeat "Issues detected; see $OUT"
fi
