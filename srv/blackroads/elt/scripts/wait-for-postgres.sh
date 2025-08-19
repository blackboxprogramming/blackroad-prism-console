#!/bin/sh
set -e
HOST="$1"
shift
until pg_isready -h "$HOST" -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "Waiting for Postgres..."
  sleep 1
done
exec "$@"
