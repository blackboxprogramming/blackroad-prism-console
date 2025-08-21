#!/bin/bash
set -euo pipefail

# Harden SSH and setup firewall
adduser --disabled-password --gecos "" deploy || true
usermod -aG sudo deploy
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
echo 'AllowUsers deploy' >> /etc/ssh/sshd_config
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw --force enable
systemctl restart ssh
