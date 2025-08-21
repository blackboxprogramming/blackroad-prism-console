#!/bin/bash
set -euo pipefail

apt-get install -y wireguard
WG_CONF=/etc/wireguard/wg0.conf
if [ ! -f "$WG_CONF" ]; then
  umask 077
  wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
  cat <<CFG > "$WG_CONF"
[Interface]
Address = 10.10.0.1/24
PrivateKey = $(cat /etc/wireguard/privatekey)
ListenPort = 51820
CFG
fi
systemctl enable --now wg-quick@wg0
