#!/usr/bin/env bash
# /opt/blackroad/iam/ca/generate.sh
set -euo pipefail
openssl req -x509 -newkey rsa:2048 -nodes -subj "/CN=BlackRoad Root" \
  -keyout root.key -out root.pem -days 3650
