# FILE: /srv/blackroad-api/system/healthcheck.sh
#!/usr/bin/env bash
set -euo pipefail
curl -fsS http://127.0.0.1:4000/api/health | jq . >/dev/null
