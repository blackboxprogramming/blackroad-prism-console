#!/usr/bin/env bash
set -euo pipefail
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
test "$ok" -ge 3 || (echo "Smoke failed"; exit 1)
