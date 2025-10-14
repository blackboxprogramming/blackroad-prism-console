#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
VENV_DIR="${VENV_DIR:-$HOME/agent-venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
REQUIREMENTS_FILE="$STACK_DIR/requirements.txt"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "error: $PYTHON_BIN is not available. Install Python 3 before continuing." >&2
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
else
  echo "Using existing virtual environment at $VENV_DIR"
fi

# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

pip install --upgrade pip wheel
if [ -f "$REQUIREMENTS_FILE" ]; then
  pip install -r "$REQUIREMENTS_FILE"
else
  echo "warning: requirements file not found at $REQUIREMENTS_FILE" >&2
fi

deactivate

if [ ! -f "$STACK_DIR/.env" ] && [ -f "$STACK_DIR/.env.example" ]; then
  cp "$STACK_DIR/.env.example" "$STACK_DIR/.env"
  echo "Created default .env file at $STACK_DIR/.env"
fi

echo "Installing systemd services"
"$STACK_DIR/scripts/install_pi_services.sh"
