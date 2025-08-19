#!/usr/bin/env bash
set -euo pipefail

# shellcheck disable=SC1091
source .venv/bin/activate

mkdir -p runs/es_local

tensorboard --logdir runs/es_local --port 6006 &
TB_PID=$!

tail -n 20 -F runs/es_local/train.log &
TAIL_PID=$!

python -m local.run_cartpole "$@"

kill $TB_PID $TAIL_PID 2>/dev/null || true
