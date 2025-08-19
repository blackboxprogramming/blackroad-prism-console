#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source ../.venv/bin/activate
export LUCIDIA_MODEL="${LUCIDIA_MODEL:-lucidia}"
uvicorn lucidia.main:app --host 0.0.0.0 --port 8088
