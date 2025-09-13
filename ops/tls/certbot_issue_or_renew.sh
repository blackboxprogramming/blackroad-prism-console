#!/usr/bin/env bash
set -euo pipefail
DOMAINS="-d blackroad.io -d www.blackroad.io -d blackroadinc.us -d www.blackroadinc.us"
EMAIL="amundsonalexa@gmail.com"
certbot --nginx ${DOMAINS} --agree-tos -m "$EMAIL" --keep-until-expiring --redirect --non-interactive
systemctl reload nginx || true
