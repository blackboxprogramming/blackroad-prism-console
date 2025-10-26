#!/usr/bin/env bash
set -euo pipefail

: "${UVICORN_HOST:=0.0.0.0}"
: "${UVICORN_PORT:=8000}"

exec uvicorn app.main:app --host "${UVICORN_HOST}" --port "${UVICORN_PORT}" --log-level info
set -e
uvicorn app.main:app --host 0.0.0.0 --port 8001
