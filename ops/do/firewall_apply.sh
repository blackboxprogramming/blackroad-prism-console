#!/usr/bin/env bash
set -euo pipefail
NAME="blackroad-fw"
doctl compute firewall create \
  --name "$NAME" \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0" \
  --inbound-rules "protocol:tcp,ports:80,address:0.0.0.0/0" \
  --inbound-rules "protocol:tcp,ports:443,address:0.0.0.0/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0" || true
echo "Firewall ensured"
