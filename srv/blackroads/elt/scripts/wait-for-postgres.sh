# <!-- FILE: /srv/blackroads/elt/scripts/wait-for-postgres.sh -->
#!/usr/bin/env bash
set -e

until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "Waiting for Postgres..."
  sleep 1
done
