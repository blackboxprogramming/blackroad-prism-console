#!/usr/bin/env bash
set -euo pipefail
cp ops/tls/nginx.tls.conf /etc/nginx/sites-available/blackroad.conf
ln -sfn /etc/nginx/sites-available/blackroad.conf /etc/nginx/sites-enabled/blackroad.conf
nginx -t && systemctl reload nginx
