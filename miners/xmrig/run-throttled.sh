#!/usr/bin/env bash
set -euo pipefail
# Low-power burst runner for xmrig. Caps CPU via short bursts + cooloffs.
# env: POOL_HOST_PORT, XMR_ADDR, THREADS, MAX_TEMP_C, BURST_SEC, COOL_SEC
# Wrapper that runs xmrig in short bursts and cools off if temp is high.
# Requires: xmrig binary available (for native), or you can just use the Docker service.

POOL="${POOL_HOST_PORT:-POOL_HOST:PORT}"
ADDR="${XMR_ADDR:-YOUR_XMR_ADDRESS}"
THREADS="${THREADS:-1}"
MAX_TEMP_C="${MAX_TEMP_C:-70}"
BURST_SEC="${BURST_SEC:-90}"
COOL_SEC="${COOL_SEC:-60}"
CMD=(/home/pi/xmrig/build/xmrig -o "$POOL" -u "$ADDR" --donate-level=0 --cpu-max-threads-hint="$THREADS")

read_temp() {
  if command -v vcgencmd >/dev/null 2>&1; then
    vcgencmd measure_temp | sed 's/[^0-9.]//g'
MAX_TEMP_C="${MAX_TEMP_C:-70}"     # Pi CPU max temp before cooldown
BURST_SEC="${BURST_SEC:-90}"       # mine for N seconds
COOL_SEC="${COOL_SEC:-60}"         # then rest M seconds

xmrig_cmd=(/home/pi/xmrig/build/xmrig -o "$POOL" -u "$ADDR" --donate-level=0 --cpu-max-threads-hint="$THREADS")

read_temp() {
  if command -v vcgencmd >/dev/null 2>&1; then
    # vcgencmd measure_temp -> temp=49.0'C
    vcgencmd measure_temp | sed "s/[^0-9.]//g"
  elif [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    awk '{printf "%.1f\n",$1/1000}' /sys/class/thermal/thermal_zone0/temp
  else
    echo 0
  fi
}

while true; do
  T="$(read_temp)"
  if [ "${T%.*}" -ge "$MAX_TEMP_C" ]; then
    sleep "$COOL_SEC"
    continue
  fi
  timeout "$BURST_SEC" nice -n 19 "${CMD[@]}" || true
    # too hot, wait
    sleep "$COOL_SEC"
    continue
  fi
  # run a burst at lowest priority
  timeout "$BURST_SEC" nice -n 19 "${xmrig_cmd[@]}" || true
  sleep "$COOL_SEC"
done
