#!/usr/bin/env bash
set -euo pipefail
CA_DIR=/etc/nginx/client_ca
NAME="${1:-Claude-Partner}"
DAYS="${2:-365}"

sudo mkdir -p "$CA_DIR"
cd "$CA_DIR"

# 1) CA (if absent)
if [ ! -f ca.key ]; then
  openssl genrsa -out ca.key 4096
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
    -subj "/CN=BlackRoad Partner CA" -out ca.crt
  echo "[+] Created CA at $CA_DIR"
fi

# 2) Client key + CSR
openssl genrsa -out "$NAME.key" 4096
openssl req -new -key "$NAME.key" -subj "/CN=$NAME" -out "$NAME.csr"

# 3) Sign client cert
openssl x509 -req -in "$NAME.csr" -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out "$NAME.crt" -days "$DAYS" -sha256 \
  -extfile <(printf "subjectAltName=DNS:%s\nextendedKeyUsage=clientAuth\n" "$NAME")

# 4) Export P12 bundle for easy sharing (protect with a pass)
PASS=$(openssl rand -hex 12)
echo "$PASS" > "$NAME.p12.pass"
openssl pkcs12 -export -inkey "$NAME.key" -in "$NAME.crt" -certfile ca.crt \
  -out "$NAME.p12" -passout pass:"$PASS"

echo "[+] Issued client cert:"
echo "    Subject CN: $NAME"
echo "    Files: $CA_DIR/$NAME.crt $CA_DIR/$NAME.key"
echo "    P12:   $CA_DIR/$NAME.p12  (password in $CA_DIR/$NAME.p12.pass)"
echo "[!] Copy $CA_DIR/ca.crt into Nginx ssl_client_certificate (already set)."
