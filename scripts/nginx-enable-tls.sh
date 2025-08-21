#!/usr/bin/env bash
# Optional: enable HTTPS with Let's Encrypt (requires DNS -> server)
# Usage: bash scripts/nginx-enable-tls.sh blackroad.io admin@example.com
set -euo pipefail
DOMAIN="${1:-blackroad.io}"
EMAIL="${2:-admin@example.com}"

apt-get update -y
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --agree-tos -m "$EMAIL" --redirect -n
systemctl reload nginx
echo "TLS enabled on https://$DOMAIN"

