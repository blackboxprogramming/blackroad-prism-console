<!-- FILE: /infra/wireguard/gen-peers.sh -->
#!/usr/bin/env bash
set -euo pipefail

PEERS_FILE=${1:-peers.csv}
TEMPLATE_DIR=$(dirname "$0")
WG_CONF=${TEMPLATE_DIR}/wg0.conf

if [[ ! -f "$TEMPLATE_DIR/wg0.conf.template" ]]; then
  echo "Template wg0.conf.template not found" >&2
  exit 1
fi

if [[ ! -f "$PEERS_FILE" ]]; then
  echo "Peers file $PEERS_FILE not found" >&2
  exit 1
fi

# Rebuild config from template
envsubst < "$TEMPLATE_DIR/wg0.conf.template" > "$WG_CONF"

while IFS=, read -r NAME PUBKEY IP; do
  [[ -z "$NAME" || "$NAME" =~ ^# ]] && continue
  cat >> "$WG_CONF" <<PEER

[Peer]
# $NAME
PublicKey = $PUBKEY
AllowedIPs = $IP/32
PersistentKeepalive = 25
PEER

done < "$PEERS_FILE"

chmod 600 "$WG_CONF"
echo "Generated $WG_CONF from $PEERS_FILE"
