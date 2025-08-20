#!/bin/bash
set -euo pipefail

apt-get install -y nsd
cat <<CFG > /etc/nsd/nsd.conf
server:
  hide-version: yes
zonesdir: "/etc/nsd/zones"
zone:
  name: blackroad.io
  zonefile: blackroad.io.zone
CFG
mkdir -p /etc/nsd/zones
systemctl enable --now nsd
