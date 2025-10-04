#!/usr/bin/env bash
set -euo pipefail

# Hosts to check; override by providing arguments
HOSTS=("lucidia@pi" "alice@raspberrypi" "alexa@Alexas-MacBook-Pro-2")

if [[ $# -gt 0 ]]; then
  HOSTS=("$@")
fi

missing_dep=0
for cmd in ssh ping; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Required dependency '$cmd' is not installed" >&2
    missing_dep=1
  fi
done

if [[ $missing_dep -ne 0 ]]; then
  exit 1
fi

for host in "${HOSTS[@]}"; do
  echo "\n=== Checking $host ==="
  target="${host#*@}"
  if ping -c 1 -W 2 "$target" >/dev/null 2>&1; then
    echo "[OK] Host $target responded to ping"
  else
    echo "[WARN] Host $target did not respond to ping"
  fi

  if ssh -o BatchMode=yes -o ConnectTimeout=5 "$host" exit >/dev/null 2>&1; then
    echo "[OK] SSH connectivity to $host confirmed"
  else
    echo "[WARN] Could not establish passwordless SSH session to $host"
  fi

done

echo "\nNetwork verification complete."
