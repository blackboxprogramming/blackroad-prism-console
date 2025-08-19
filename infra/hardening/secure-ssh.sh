# <!-- FILE: /infra/hardening/secure-ssh.sh -->
#!/usr/bin/env bash
set -euo pipefail

sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
apt-get update && apt-get install -y fail2ban
<!-- FILE: /infra/hardening/secure-ssh.sh -->
#!/usr/bin/env bash
set -euo pipefail

if ! dpkg -s openssh-server >/dev/null 2>&1; then
  apt-get update && apt-get install -y openssh-server
fi

if ! dpkg -s fail2ban >/dev/null 2>&1; then
  apt-get update && apt-get install -y fail2ban
fi

SSHD_CONF=/etc/ssh/sshd_config
sed -ri 's/^#?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONF"
sed -ri 's/^#?PermitRootLogin.*/PermitRootLogin prohibit-password/' "$SSHD_CONF"
sed -ri 's/^#?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "$SSHD_CONF"

systemctl restart sshd
systemctl enable --now fail2ban

echo "SSH hardened and fail2ban enabled"
