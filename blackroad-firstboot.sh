#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fatal() {
  log "ERROR: $1"
  exit 1
}

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  fatal "Run as root (sudo)."
fi

HOSTNAME_TARGET=${HOSTNAME_TARGET:-blackroad-pi}
CONFIG_TXT=${CONFIG_TXT:-/boot/config.txt}
EEPROM_CONFIG_TMP="$(mktemp)"
JETSON_IP=${JETSON_IP:-192.168.4.23}
JETSON_USER=${JETSON_USER:-jetson}
PI_USER=${PI_USER:-pi}
PI_HOME="$(eval echo ~"${PI_USER}")"

cleanup() {
  rm -f "$EEPROM_CONFIG_TMP"
}
trap cleanup EXIT

log "BlackRoad first boot: starting provisioning"

# 1) Hostname configuration
current_hostname="$(hostnamectl --static 2>/dev/null || hostname)"
if [[ "$current_hostname" != "$HOSTNAME_TARGET" ]]; then
  log "Setting hostname to ${HOSTNAME_TARGET}"
  hostnamectl set-hostname "$HOSTNAME_TARGET" || fatal "Failed to set hostname"
  if [[ -f /etc/hosts ]]; then
    if grep -qE "\s${HOSTNAME_TARGET}(\s|$)" /etc/hosts; then
      :
    else
      log "Updating /etc/hosts with ${HOSTNAME_TARGET}"
      printf '127.0.1.1\t%s\n' "$HOSTNAME_TARGET" >> /etc/hosts
    fi
  fi
else
  log "Hostname already ${HOSTNAME_TARGET}"
fi

# 2) Clean HDMI overrides (remove previous BlackRoad markers)
if [[ -f "$CONFIG_TXT" ]]; then
  if grep -q '# BlackRoad HDMI overrides' "$CONFIG_TXT"; then
    log "Cleaning prior BlackRoad HDMI overrides from ${CONFIG_TXT}"
    tmp_config="$(mktemp)"
    sed '/# BlackRoad HDMI overrides START/,/# BlackRoad HDMI overrides END/d' "$CONFIG_TXT" > "$tmp_config"
    cp "$tmp_config" "$CONFIG_TXT"
    rm -f "$tmp_config"
  else
    log "No BlackRoad HDMI overrides detected in ${CONFIG_TXT}"
  fi
else
  log "${CONFIG_TXT} not found; skipping HDMI cleanup"
fi

# 3) Lock EEPROM boot order (prefer SSD/USB then SD)
if command -v rpi-eeprom-config >/dev/null 2>&1; then
  desired_boot_order=${BOOT_ORDER_OVERRIDE:-0xf41}
  rpi-eeprom-config > "$EEPROM_CONFIG_TMP"
  current_boot_order=$(grep '^BOOT_ORDER=' "$EEPROM_CONFIG_TMP" | head -n1 | cut -d= -f2 || true)
  if [[ "$current_boot_order" != "$desired_boot_order" ]]; then
    log "Setting EEPROM BOOT_ORDER to ${desired_boot_order}"
    if grep -q '^BOOT_ORDER=' "$EEPROM_CONFIG_TMP"; then
      sed -i "s/^BOOT_ORDER=.*/BOOT_ORDER=${desired_boot_order}/" "$EEPROM_CONFIG_TMP"
    else
      printf '\nBOOT_ORDER=%s\n' "$desired_boot_order" >> "$EEPROM_CONFIG_TMP"
    fi
    rpi-eeprom-config --apply "$EEPROM_CONFIG_TMP" || log "Failed to apply EEPROM config (non-fatal)"
  else
    log "EEPROM BOOT_ORDER already ${desired_boot_order}"
  fi
else
  log "rpi-eeprom-config not available; skipping EEPROM boot order lock"
fi

# Ensure SSH directory exists for Pi user
if [[ ! -d "${PI_HOME}/.ssh" ]]; then
  log "Creating SSH directory for ${PI_USER}"
  install -d -m 700 -o "$PI_USER" -g "$PI_USER" "${PI_HOME}/.ssh"
fi

# 4) Enable SSH service (if available)
if systemctl list-unit-files | grep -q '^ssh\.service'; then
  log "Enabling SSH service"
  systemctl enable --now ssh || log "Failed to enable SSH service (non-fatal)"
fi

# 5) Install core packages
log "Installing base packages…"
apt-get update -y
apt-get install -y git htop vim curl python3-pip rsync

# Optional extras — uncomment as needed
# apt-get install -y docker.io
# usermod -aG docker pi

# 6) Set up Jetson integration

# a) Add Jetson to /etc/hosts
if ! grep -q 'jetson.local' /etc/hosts; then
  printf '%s    jetson.local\n' "$JETSON_IP" >> /etc/hosts
  log "Added Jetson to /etc/hosts"
fi

# b) Set up SSH keypair if not already
if [[ ! -f "${PI_HOME}/.ssh/id_rsa" ]]; then
  log "Generating SSH key for ${PI_USER} user"
  sudo -u "$PI_USER" ssh-keygen -t rsa -N "" -f "${PI_HOME}/.ssh/id_rsa"
fi

# c) Copy key to Jetson (assumes passwordless setup or you'll type once)
if command -v ssh-copy-id >/dev/null 2>&1; then
  sudo -u "$PI_USER" ssh-copy-id -i "${PI_HOME}/.ssh/id_rsa.pub" "${JETSON_USER}@${JETSON_IP}" || log "Manual ssh-copy-id needed"
else
  log "ssh-copy-id not available; skip automatic key install"
fi

# d) Create sync script
cat <<'SYNC' > /usr/local/bin/blackroad-sync.sh
#!/usr/bin/env bash
# sync Pi’s ~/projects with Jetson’s ~/blackroad
rsync -avz ~/projects/ jetson.local:~/blackroad/
SYNC
chmod +x /usr/local/bin/blackroad-sync.sh
log "Jetson sync script installed at /usr/local/bin/blackroad-sync.sh"

log "BlackRoad first boot tasks complete"
log "Rebooting in 5 seconds…"
sleep 5
reboot
