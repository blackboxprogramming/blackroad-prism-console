#!/usr/bin/env bash
set -euo pipefail
: "${CHAOS_ENABLED:=false}"
[ "$CHAOS_ENABLED" != "true" ] && { echo "CHAOS_DISABLED"; exit 0; }
tc qdisc add dev eth0 root netem delay 120ms 20ms distribution normal || true
echo "Injected latency"
