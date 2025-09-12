#!/bin/bash
set -euo pipefail

# Simulate a multi-region failover between us-east and eu-west
regions=("us-east" "eu-west")

for region in "${regions[@]}"; do
  echo "[health] checking $region"
  curl -fsS "https://$region.blackroad.io/healthz" >/dev/null || echo "warning: $region unreachable"
  # replicate audit logs placeholder
  echo "[logs] sync audit logs from $region to secondary WORM bucket"
  # aws s3 sync s3://audit-logs-$region s3://audit-logs-$other --sse
  echo "[done] audit log replication for $region"
  echo
  sleep 1
  other_region="eu-west"
  if [ "$region" = "eu-west" ]; then
    other_region="us-east"
  fi
  echo "[routing] ensuring traffic can shift from $region to $other_region"
  echo "dns_cname_update blackroad.io $other_region.blackroad.io"
  echo
  sleep 1
done

echo "[complete] multi-region failover drill finished"
