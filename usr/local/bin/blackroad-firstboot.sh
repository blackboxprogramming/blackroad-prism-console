#!/usr/bin/env bash
set -euo pipefail

# --- knobs ---
BOOT_ORDER="0xf14"   # USB→SD; flip to 0xf41 for SD→USB
HOSTNAME="blackroad"

LOG="/var/log/blackroad-firstboot.log"
log(){ echo "[$(date +'%F %T')] $*" | tee -a "$LOG"; }

log "== BlackRoad OS firstboot =="

# 1) Finalize hostname (in case re-flash changed it)
echo "$HOSTNAME" | sudo tee /etc/hostname
sudo sed -i "s/127.0.1.1.*/127.0.1.1\t$HOSTNAME/" /etc/hosts
log "Hostname set to $HOSTNAME"

# 2) Clean up HDMI safe mode (leave usb_max_current_enable in place)
BOOT="/boot"
[ -f /boot/firmware/config.txt ] && BOOT="/boot/firmware"
CFG="$BOOT/config.txt"
if [ -f "$CFG" ]; then
  sudo cp -n "$CFG" "$CFG.bak.blackroad.$(date +%Y%m%d-%H%M%S)"
  sudo sed -i '/^hdmi_safe=/d' "$CFG"
  sudo sed -i '/^hdmi_force_hotplug=/d' "$CFG"
  log "Removed hdmi_safe and hdmi_force_hotplug from $CFG"
else
  log "WARN: no config.txt found at $CFG"
fi

# 3) Set EEPROM boot order
tmpd=$(mktemp -d)
cur="$(sudo rpi-eeprom-config 2>/dev/null | awk -F= '/^BOOT_ORDER=/{print $2; exit}' | tr -d '[:space:]')"
log "Current BOOT_ORDER: ${cur:-unknown} | Desired: $BOOT_ORDER"

sudo rpi-eeprom-config > "$tmpd/cur.txt"
if grep -q '^BOOT_ORDER=' "$tmpd/cur.txt"; then
  sed "s/^BOOT_ORDER=.*/BOOT_ORDER=$BOOT_ORDER/" "$tmpd/cur.txt" > "$tmpd/new.txt"
else
  cp "$tmpd/cur.txt" "$tmpd/new.txt"
  echo "BOOT_ORDER=$BOOT_ORDER" >> "$tmpd/new.txt"
fi

if sudo rpi-eeprom-config --apply "$tmpd/new.txt" >>"$LOG" 2>&1; then
  log "Applied EEPROM config via --apply"
else
  log "Fallback: building image and flashing"
  sudo rpi-eeprom-config --out "$tmpd/pieeprom-new.bin" --config "$tmpd/new.txt"
  sudo rpi-eeprom-update -d -f "$tmpd/pieeprom-new.bin"
fi

new="$(sudo rpi-eeprom-config 2>/dev/null | awk -F= '/^BOOT_ORDER=/{print $2; exit}' | tr -d '[:space:]')"
log "After BOOT_ORDER: ${new:-unknown}"

# 4) Drop in a welcome banner (MOTD)
cat <<'EOM' | sudo tee /etc/motd >/dev/null
##################################
      BlackRoad OS is live
      (Raspberry Pi 5)
##################################
EOM

log "Firstboot setup complete. Reboot to apply changes."

