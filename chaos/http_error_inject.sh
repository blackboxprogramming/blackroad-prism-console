#!/usr/bin/env bash
set -euo pipefail
: "${CHAOS_ENABLED:=false}"
[ "$CHAOS_ENABLED" != "true" ] && { echo "CHAOS_DISABLED"; exit 0; }
iptables -A OUTPUT -p tcp --dport 4000 -m statistic --mode random --probability 0.05 -j REJECT || true
echo "Injected 5% outbound rejects to port 4000"
