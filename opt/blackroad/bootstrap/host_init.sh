#!/usr/bin/env bash
# /opt/blackroad/bootstrap/host_init.sh
set -euo pipefail

MY_IP=${MY_IP:-"203.0.113.4"}

plan(){
  cat <<'PLAN'
Tasks:
- create users blackroad and deploy
- enforce key-only SSH
- configure fail2ban and UFW
- enable systemd-timesyncd and unattended-upgrades
- mount /var/lib if /dev/vdb exists
- tune journald
- install docker, docker-compose-plugin, podman, nerdctl
- install healthprobe
PLAN
}

apply(){
  id blackroad &>/dev/null || useradd -m -s /bin/bash blackroad
  id deploy &>/dev/null || useradd -m -s /bin/bash deploy
  echo 'blackroad ALL=(ALL) NOPASSWD: /usr/bin/systemctl' >/etc/sudoers.d/blackroad
  echo 'deploy ALL=(blackroad) NOPASSWD: /usr/bin/docker' >/etc/sudoers.d/deploy

  apt-get update
  apt-get install -y sudo ufw fail2ban unattended-upgrades systemd-timesyncd \
    docker.io docker-compose-plugin podman nerdctl

  sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  sed -i 's/^#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
  mkdir -p /home/blackroad/.ssh /home/deploy/.ssh
  chmod 700 /home/blackroad/.ssh /home/deploy/.ssh

  ufw default deny incoming
  ufw default allow outgoing
  ufw allow from "$MY_IP" to any port 22 proto tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable

  systemctl enable --now systemd-timesyncd

  cat >/etc/issue <<'BANNER'
BLACKROAD | Lucidia
BANNER
  sed -i 's|^\s*#\?\s*PrintMotd.*|PrintMotd yes|' /etc/ssh/sshd_config

  mkdir -p /etc/apt/apt.conf.d
  cat >/etc/apt/apt.conf.d/50unattended-upgrades <<'UUP'
Unattended-Upgrade::Origins-Pattern {
"o=Debian,a=stable-security";
};
UUP
  systemctl enable --now unattended-upgrades

  if [ -b /dev/vdb ] && ! mount | grep -q '/var/lib '; then
    mkfs.ext4 -F /dev/vdb
    mkdir -p /var/lib
    echo '/dev/vdb /var/lib ext4 defaults 0 2' >>/etc/fstab
    mount /var/lib
  fi

  mkdir -p /etc/systemd/journald.conf.d
  cat >/etc/systemd/journald.conf.d/limits.conf <<'JRN'
[Journald]
SystemMaxUse=1G
RuntimeMaxUse=200M
JRN
  systemctl restart systemd-journald

  cat >/usr/local/bin/healthprobe <<'HP'
#!/usr/bin/env bash
CPU=$(awk -v FS=' ' '/^cpu /{printf("%.0f",($2+$4)*100/($2+$4+$5))}' /proc/stat)
DISK=$(df -P / | awk 'NR==2{print 100-$5}' )
if [ "$CPU" -gt 95 ] || [ "$DISK" -lt 10 ]; then exit 1; fi
exit 0
HP
  chmod +x /usr/local/bin/healthprobe

  systemctl restart sshd
}

case "${1:-}" in
  --plan) plan ;;
  *) plan; read -r -p "Apply? [y/N]" yn; [ "$yn" = "y" ] && apply ;;
esac
