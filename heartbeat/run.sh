#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${VENV_DIR:-$SCRIPT_DIR/.venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "[heartbeat] creating virtual environment at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

pip install --upgrade pip >/dev/null
pip install --quiet --requirement "$SCRIPT_DIR/requirements.txt"

echo "[heartbeat] starting publisher"
exec "$VENV_DIR/bin/python" "$SCRIPT_DIR/heartbeat.py" "$@"
