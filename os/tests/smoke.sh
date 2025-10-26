#!/usr/bin/env bash
set -euo pipefail

HOST="${BLACKROAD_HOST:-localhost}"
TIMEOUT="${SMOKE_TIMEOUT:-300}"
INTERVAL="${SMOKE_INTERVAL:-5}"
SERVICES=(
  "http://${HOST}/api/health"
  "http://${HOST}/autopal/health"
  "http://${HOST}/aicode/api/health"
  "http://${HOST}/pi-ops/health"
  "http://${HOST}/health"
)

start_time=$(date +%s)

echo "Waiting for services to become healthy (timeout: ${TIMEOUT}s)"

while true; do
  failures=0
  for svc in "${SERVICES[@]}"; do
    if curl -fsS "${svc}" >/dev/null 2>&1; then
      echo "[OK] ${svc}"
    else
      echo "[FAIL] ${svc}"
      ((failures++))
    fi
  done

  if [[ ${failures} -eq 0 ]]; then
    echo "All services healthy"
    exit 0
  fi

  now=$(date +%s)
  if (( now - start_time > TIMEOUT )); then
    echo "Smoke test failed: services unhealthy after ${TIMEOUT}s"
    exit 1
  fi

  echo "Retrying in ${INTERVAL}s"
  sleep "${INTERVAL}"
done
urls=(
  "http://localhost/"
  "http://localhost/api/health"
  "http://localhost/autopal/health"
  "http://localhost/aicode/api/health"
  "http://localhost/pi-ops/health"
)
ok=0
for u in "${urls[@]}"; do
  echo "Checking $u"
  if curl -fsS "$u" >/dev/null; then echo "OK $u"; ((ok++)); else echo "FAIL $u"; fi
done
if curl -fsS http://localhost/grafana/login >/dev/null; then
  echo "OK grafana"
else
  echo "WARN grafana"
fi
test "$ok" -ge 3 || (echo "Smoke failed"; exit 1)
