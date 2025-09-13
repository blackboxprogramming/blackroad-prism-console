#!/usr/bin/env bash
set -euo pipefail
tc qdisc del dev eth0 root 2>/dev/null || true
iptables -F || true
echo "Chaos reverted"
