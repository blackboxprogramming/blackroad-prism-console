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
set -e
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOGDIR="$ROOT/runs/es_local"

case "$1" in
  train)
    shift
    source "$ROOT/.venv/bin/activate"
    python "$ROOT/local/run_cartpole.py" "$@"
    ;;
  tb)
    shift
    source "$ROOT/.venv/bin/activate"
    tensorboard --logdir "$LOGDIR" --port 6006 "$@"
    ;;
  logs)
    tail -n 20 "$LOGDIR/train.log"
    ;;
  *)
    echo "Usage: $0 {train|tb|logs} [args]"
    exit 1
    ;;
esac
