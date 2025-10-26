#!/usr/bin/env bash
set -euo pipefail

CN="${1:-pi.local}"
OUT="/opt/blackroad/os/tls/certs"
mkdir -p "$OUT"

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$OUT/server.key" \
  -out "$OUT/server.crt" \
  -days 825 \
  -subj "/CN=${CN}" \
  -addext "subjectAltName=DNS:${CN},DNS:localhost,IP:127.0.0.1"

echo "Self-signed certs created for CN=${CN}"
echo "Files:"
ls -l "$OUT/server."*
