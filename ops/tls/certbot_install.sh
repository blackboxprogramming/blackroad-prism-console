#!/usr/bin/env bash
set -euo pipefail
apt-get update -y
apt-get install -y certbot python3-certbot-nginx
echo "certbot installed"
