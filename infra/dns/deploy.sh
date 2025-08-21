# <!-- FILE: /infra/dns/deploy.sh -->
#!/usr/bin/env bash
set -euo pipefail

nsd-control reconfig
