#!/usr/bin/env bash
set -euo pipefail
# Minimal CUDA xmrig run wrapper with duty cycle + temp guard (tegrastats)
# env:
#  POOL=host:port
#  ADDR=your_address
#  THREADS=1            # CPU hint (GPU hashes are small; this is demo)
#  BURST_SEC=90         # mine N seconds, then cool
#  COOL_SEC=60
#  MAX_TEMP_C=70
# CUDA xmrig wrapper with duty-cycle + temp guard (tegrastats)
# env: POOL=host:port ADDR=address THREADS=1 BURST_SEC=90 COOL_SEC=60 MAX_TEMP_C=70

POOL="${POOL:-POOL_HOST:PORT}"
ADDR="${ADDR:-YOUR_ADDRESS}"
THREADS="${THREADS:-1}"
BURST_SEC="${BURST_SEC:-90}"
COOL_SEC="${COOL_SEC:-60}"
MAX_TEMP_C="${MAX_TEMP_C:-70}"

read_temp() {
  # tegrastats outputs "GPU 10%@xxxMHz CPU@... Tboard@XXC Tdiode@YYC ..."
  if command -v tegrastats >/dev/null 2>&1; then
    local out
    out=$(tegrastats --interval 1000 --count 1 2>/dev/null || true)
    # extract max of common sensors if present
    local t
    t=$(echo "$out" | sed -n 's/.*\(Tdiode@\|Tboard@\)\([0-9]\{1,3\}\)C.*/\2/p' | sort -nr | head -n1)
  if command -v tegrastats >/dev/null 2>&1; then
    local out; out=$(tegrastats --interval 1000 --count 1 2>/dev/null || true)
    local t; t=$(echo "$out" | sed -n 's/.*\(Tdiode@\|Tboard@\)\([0-9]\{1,3\}\)C.*/\2/p' | sort -nr | head -n1)
    echo "${t:-0}"
  else
    echo 0
  fi
}

CMD=(/opt/xmrig/build/xmrig -o "$POOL" -u "$ADDR" --donate-level=0 --cpu-max-threads-hint="$THREADS")

while true; do
  T="$(read_temp)"
  if [ "${T:-0}" -ge "$MAX_TEMP_C" ]; then
    sleep "$COOL_SEC"
    continue
while true; do
  T="$(read_temp)"
  if [ "${T:-0}" -ge "$MAX_TEMP_C" ]; then
    sleep "$COOL_SEC"; continue
  fi
  timeout "$BURST_SEC" nice -n 19 "${CMD[@]}" || true
  sleep "$COOL_SEC"
done
