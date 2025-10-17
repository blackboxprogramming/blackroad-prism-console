#!/usr/bin/env bash
# quick power-mode helper for Jetson (requires sudo)
# examples:
#   sudo ./nvpmodel.sh 1   # 10W-ish mode on many Jetsons
#   sudo ./nvpmodel.sh 2   # 15W-ish
set -euo pipefail
MODE="${1:-1}"
if ! command -v nvpmodel >/dev/null 2>&1; then
  echo "nvpmodel not found (JetPack required)"; exit 1
fi
sudo nvpmodel -m "$MODE"
sudo systemctl restart nvfancontrol || true
echo "Set nvpmodel mode to $MODE"
