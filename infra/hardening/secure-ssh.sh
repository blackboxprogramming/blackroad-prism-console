# <!-- FILE: /infra/hardening/secure-ssh.sh -->
#!/usr/bin/env bash
set -euo pipefail

sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
apt-get update && apt-get install -y fail2ban
