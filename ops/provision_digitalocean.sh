#!/usr/bin/env bash
# Provision a DO droplet + firewall; requires doctl login first.
set -euo pipefail
: "${DO_REGION:=sfo3}"
: "${DO_SIZE:=s-1vcpu-1gb}"
: "${DO_IMAGE:=docker-20-04}"   # or "ubuntu-22-04-x64"
: "${DROPLET_NAME:=codex-infinity}"
: "${SSH_KEY_ID:=<REPLACE_ME>}" # numeric id or name in DO

echo "Creating droplet $DROPLET_NAME in $DO_REGION ..."
doctl compute droplet create "$DROPLET_NAME" \
  --region "$DO_REGION" --size "$DO_SIZE" --image "$DO_IMAGE" \
  --ssh-keys "$SSH_KEY_ID" --wait

IP=$(doctl compute droplet get "$DROPLET_NAME" --format PublicIPv4 --no-header)
echo "Droplet IP: $IP"

echo "Creating firewall rules ..."
doctl compute firewall create \
  --name "${DROPLET_NAME}-fw" \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0" \
  --inbound-rules "protocol:tcp,ports:80,address:0.0.0.0/0" \
  --inbound-rules "protocol:tcp,ports:443,address:0.0.0.0/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0"

echo "Bootstrap droplet ..."
DROPLET_HOST="$IP" bash ops/bootstrap_droplet.sh
echo "Done. Point DNS A records for blackroad.io and blackroadinc.us to $IP"

