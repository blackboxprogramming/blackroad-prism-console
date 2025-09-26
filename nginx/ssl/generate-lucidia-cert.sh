#!/bin/bash
set -euo pipefail
# Generate a self-signed certificate for lucidia.blackroad.io
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout lucidia.blackroad.io.key -out lucidia.blackroad.io.pem \
  -subj "/CN=lucidia.blackroad.io"

echo "Generated lucidia.blackroad.io self-signed certificate in nginx/ssl/."
