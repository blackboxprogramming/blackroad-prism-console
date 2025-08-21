# <!-- FILE: /ops/scripts/pg-failover.sh -->
#!/usr/bin/env bash
set -euo pipefail

docker exec postgres-replica repmgr standby promote
