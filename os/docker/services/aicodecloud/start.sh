#!/usr/bin/env bash
set -euo pipefail

: "${GUNICORN_WORKERS:=2}"
: "${GUNICORN_BIND:=0.0.0.0:5000}"

exec gunicorn --bind "${GUNICORN_BIND}" --workers "${GUNICORN_WORKERS}" app.wsgi:app
exec python app.py
