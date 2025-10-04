#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

exec uvicorn app:app --host 0.0.0.0 --port "${PI_OPS_PORT:-8080}"
