<!-- FILE: /ops/bootstrap.sh -->
#!/usr/bin/env bash
set -euo pipefail

# Idempotent base setup: users, ssh hardening, firewall, fail2ban, unattended upgrades

if ! id -u lucidia >/dev/null 2>&1; then
  useradd -m -s /bin/bash lucidia
fi

mkdir -p /home/lucidia/.ssh
chmod 700 /home/lucidia/.ssh

# SSH hardening
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh || true

# firewall via nftables
if command -v nft >/dev/null; then
  cat <<'NFT' > /etc/nftables.conf
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
  chain input {
    type filter hook input priority 0;
    policy drop;
    ct state established,related accept
    iif lo accept
    tcp dport { 22, 80, 443 } accept
  }
}
NFT
  chmod 600 /etc/nftables.conf
  systemctl enable nftables --now
fi

# fail2ban
apt-get update && apt-get install -y fail2ban unattended-upgrades >/dev/null
systemctl enable --now fail2ban

# unattended upgrades
cat <<'APT' >/etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT
