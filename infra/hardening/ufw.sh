<!-- FILE: /infra/hardening/ufw.sh -->
#!/usr/bin/env bash
set -euo pipefail

ADMIN_NET=${ADMIN_NET:-203.0.113.0/24}
WG_NET=${WG_NET:-10.44.0.0/24}

ufw --force enable >/dev/null 2>&1 || true

ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp
ufw allow from ${ADMIN_NET} to any port 22 proto tcp
ufw allow from ${WG_NET} to any port 9100 proto tcp

ufw reload

echo "UFW configured"
