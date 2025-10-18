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

  if remote_hostname=$(ssh -o BatchMode=yes -o ConnectTimeout=5 "$host" 'hostname' 2>/dev/null); then
    echo "[OK] SSH connectivity to $host confirmed (remote hostname: $remote_hostname)"
    echo "    VS Code Remote: code --remote \"ssh-remote+$host\""
  else
    echo "[WARN] Could not establish passwordless SSH session to $host"
    echo "      Tip: run 'ssh-copy-id $host' to install your public key"
  fi

done

echo "\nNetwork verification complete."
