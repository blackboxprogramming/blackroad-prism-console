#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "[pi-holo] Creating virtual environment in $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

python -m pip install --upgrade pip >/dev/null
pip install -r "$SCRIPT_DIR/requirements.txt"

export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"

extra_args=( )
if [[ "${DISABLE_AUDIO:-0}" == "1" ]]; then
  extra_args+=("--disable-audio")
fi

python "$SCRIPT_DIR/holo_renderer.py" "${extra_args[@]}" "$@"
