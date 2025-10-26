#!/usr/bin/env bash
set -euo pipefail

: "${UVICORN_HOST:=0.0.0.0}"
: "${UVICORN_PORT:=7000}"

exec uvicorn app.main:app --host "${UVICORN_HOST}" --port "${UVICORN_PORT}" --log-level info
exec uvicorn app:app --host 0.0.0.0 --port 7000
