#!/usr/bin/env bash
set -euo pipefail

log() { printf '\n[%s] %s\n' "pi-ops-kiosk" "$*"; }
fail() { printf '\n[pi-ops-kiosk] ERROR: %s\n' "$*" >&2; exit 1; }

KIOSK_DIR="${KIOSK_DIR:-$PWD/kiosk}"
TARGET_USER="${TARGET_USER:-pi}"
APT_UPDATE="${APT_UPDATE:-1}"
PKG_LIST=(chromium-browser xserver-xorg x11-xserver-utils openbox xinit unclutter fonts-noto fonts-noto-cjk fonts-noto-color-emoji)

if [ ! -d "$KIOSK_DIR" ]; then
  if [ -d "$PWD/pi-ops/kiosk" ]; then
    KIOSK_DIR="$PWD/pi-ops/kiosk"
  else
    fail "Could not locate kiosk payload. Set KIOSK_DIR to the extracted bundle."
  fi
fi

if ! command -v sudo >/dev/null 2>&1; then
  fail "sudo is required to install packages and copy system files."
fi

if ! id "$TARGET_USER" >/dev/null 2>&1; then
  fail "Target user '$TARGET_USER' does not exist on this system."
fi

TARGET_HOME=$(eval echo "~$TARGET_USER")
if [ ! -d "$TARGET_HOME" ]; then
  fail "Home directory for '$TARGET_USER' not found."
fi

log "Installing X/kiosk packages (${PKG_LIST[*]})"
if [ "${APT_UPDATE}" = "1" ]; then
  sudo apt-get update -y
fi
sudo apt-get install -y --no-install-recommends "${PKG_LIST[@]}"

log "Deploying kiosk session scripts"
sudo install -m 0755 "$KIOSK_DIR/bin/pi_ops_kiosk_session.sh" /usr/local/bin/pi_ops_kiosk_session.sh
sudo install -m 0644 "$KIOSK_DIR/xinitrc" "$TARGET_HOME/.xinitrc"
sudo chown "$TARGET_USER":"$TARGET_USER" "$TARGET_HOME/.xinitrc"

log "Configuring systemd units"
sudo install -m 0644 "$KIOSK_DIR/systemd/kiosk.service" /etc/systemd/system/kiosk.service
sudo install -d -m 0755 /etc/systemd/system/getty@tty1.service.d
sudo install -m 0644 "$KIOSK_DIR/systemd/getty-autologin.conf" /etc/systemd/system/getty@tty1.service.d/autologin.conf
sudo systemctl daemon-reload
sudo systemctl enable kiosk.service

log "Kiosk assets installed"
cat <<INSTRUCTIONS
Next steps:
  1. Edit /etc/systemd/system/kiosk.service and replace MAC_OR_IP_PLACEHOLDER with your Grafana host.
  2. Optionally adjust TARGET_USER via sudo systemctl edit kiosk if you deploy under another account.
  3. Run 'sudo systemctl daemon-reload' then 'sudo systemctl restart kiosk'.

A Grafana dashboard with UID pi-ops-ultra is bundled under grafana/pi_ops_ultra.json.
Import it into your Grafana before starting the kiosk so the URL resolves.
INSTRUCTIONS
