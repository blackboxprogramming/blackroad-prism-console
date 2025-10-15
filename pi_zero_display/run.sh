#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
VENV_DIR="${SCRIPT_DIR}/.venv"
PYTHON_BIN=${PYTHON_BIN:-python3}

if [[ ! -d "${VENV_DIR}" ]]; then
  echo "[pi-zero-display] Creating virtual environment at ${VENV_DIR}" >&2
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

pip install --upgrade pip >/dev/null
pip install -r "${SCRIPT_DIR}/requirements.txt" >/dev/null

exec python "${SCRIPT_DIR}/sim_display.py" "${@}"
