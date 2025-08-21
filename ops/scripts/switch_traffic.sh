# <!-- FILE: /ops/scripts/switch_traffic.sh -->
#!/usr/bin/env bash
set -euo pipefail

# usage: switch_traffic.sh new_service old_service
if [ "$#" -ne 2 ]; then
  echo "usage: $0 new_service old_service" >&2
  exit 1
fi

compose=/srv/blackroad/stack/docker-compose.yml
/usr/local/bin/docker compose -f "$compose" up -d "$1"
/usr/local/bin/docker compose -f "$compose" stop "$2"
