#!/usr/bin/env bash
set -euo pipefail

BOOT_ORDER="${1:-0xf14}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found." >&2
    exit 1
  fi
}

ensure_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "Error: this script must be run with sudo/root privileges." >&2
    exit 1
  fi
}

update_boot_config() {
  local config_path="/boot/config.txt"
  if [[ -f /boot/firmware/config.txt ]]; then
    config_path="/boot/firmware/config.txt"
  fi

  if [[ ! -f "$config_path" ]]; then
    echo "Warning: could not locate config.txt; skipping HDMI cleanup." >&2
    return
  fi

  echo "Cleaning up HDMI safe-mode overrides in $config_path"
  cp "$config_path" "${config_path}.blackroad.bak"
  sed -i -E '/^hdmi_safe=1$/d' "$config_path"
  sed -i -E '/^hdmi_force_hotplug=1$/d' "$config_path"
}

apply_boot_order() {
  local tmp_cfg
  tmp_cfg=$(mktemp)

  echo "Applying EEPROM boot order BOOT_ORDER=$BOOT_ORDER"
  rpi-eeprom-config --out "$tmp_cfg"
  if grep -q '^BOOT_ORDER=' "$tmp_cfg"; then
    sed -i "s/^BOOT_ORDER=.*/BOOT_ORDER=${BOOT_ORDER}/" "$tmp_cfg"
  else
    printf 'BOOT_ORDER=%s\n' "$BOOT_ORDER" >>"$tmp_cfg"
  fi
  rpi-eeprom-config --apply "$tmp_cfg"
  rm -f "$tmp_cfg"
}

main() {
  ensure_root
  require_cmd rpi-eeprom-config

  update_boot_config
  apply_boot_order

  cat <<'MSG'
BlackRoad first-boot customization complete.
- HDMI safe-mode entries removed from config.txt
- EEPROM boot order updated
A reboot is recommended to apply EEPROM settings.
MSG
}

main "$@"
