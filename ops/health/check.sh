# <!-- FILE: /ops/health/check.sh -->
#!/usr/bin/env bash
set -e

curl -sf http://localhost:8080/health >/dev/null && echo "API ok" || echo "API down"
