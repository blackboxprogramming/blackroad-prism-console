#!/usr/bin/env bash
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
