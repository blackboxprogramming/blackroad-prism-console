#!/bin/bash
set -euo pipefail

# Ensure the multi-region drill script runs without error
bash ops/scripts/drill-multi-region.sh >/tmp/multi-region.log

grep -q "multi-region failover drill finished" /tmp/multi-region.log
