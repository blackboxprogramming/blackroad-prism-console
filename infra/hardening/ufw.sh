# <!-- FILE: /infra/hardening/ufw.sh -->
#!/usr/bin/env bash
set -euo pipefail

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp
ufw allow from 127.0.0.1 proto tcp to any port 9100
ufw --force enable
