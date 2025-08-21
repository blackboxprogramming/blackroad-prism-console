#!/bin/bash
set -euo pipefail
ufw default deny incoming
ufw default deny outgoing
ufw allow out to 10.0.0.0/8
ufw allow out to 127.0.0.1
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
systemctl enable --now fail2ban
