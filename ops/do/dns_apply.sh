#!/usr/bin/env bash
# Create/ensure A and CNAME records for blackroad domains.
set -euo pipefail
IP="${1:-159.65.43.12}"
doctl compute domain records create blackroad.io --record-type A --record-name @ --record-data "$IP" --record-ttl 600 || true
doctl compute domain records create blackroad.io --record-type A --record-name "*" --record-data "$IP" --record-ttl 600 || true
doctl compute domain records create blackroad.io --record-type CNAME --record-name www --record-data "@" --record-ttl 600 || true
doctl compute domain records create blackroadinc.us --record-type A --record-name @ --record-data "$IP" --record-ttl 600 || true
doctl compute domain records create blackroadinc.us --record-type A --record-name "*" --record-data "$IP" --record-ttl 600 || true
doctl compute domain records create blackroadinc.us --record-type CNAME --record-name www --record-data "@" --record-ttl 600 || true
echo "DNS applied to $IP"
