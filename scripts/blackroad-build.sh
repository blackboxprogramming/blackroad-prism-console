#!/usr/bin/env bash
set -euo pipefail

IMG_URL="https://downloads.raspberrypi.com/raspios_lite_arm64_latest"
DEVICE="${1:-}"
HOSTNAME="blackroad"
BOOT_ORDER="0xf14"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIFI_SSID="${WIFI_SSID:-}"
WIFI_PSK="${WIFI_PSK:-}"
WIFI_COUNTRY="${WIFI_COUNTRY:-US}"
PI_USER="${PI_USER:-}"
PI_PASSWORD="${PI_PASSWORD:-}"
PI_PASSWORD_HASH="${PI_PASSWORD_HASH:-}"
PI_SSH_KEY="${PI_SSH_KEY:-}"
PI_SSH_KEY_FILE="${PI_SSH_KEY_FILE:-}"
PI_TIMEZONE="${PI_TIMEZONE:-}"
PI_LOCALE="${PI_LOCALE:-}"
PI_KEYBOARD_LAYOUT="${PI_KEYBOARD_LAYOUT:-}"
PI_KEYBOARD_VARIANT="${PI_KEYBOARD_VARIANT:-}"
PI_KEYBOARD_MODEL="${PI_KEYBOARD_MODEL:-}"

usage() {
  cat <<'USAGE'
Usage: sudo ./blackroad-build.sh /dev/sdX

This script downloads the latest Raspberry Pi OS Lite image and flashes it to the
specified block device with BlackRoad defaults applied.
Optional environment variables:
  WIFI_SSID / WIFI_PSK / WIFI_COUNTRY   Configure Wi-Fi credentials.
  PI_USER + PI_PASSWORD[_HASH]         Create the initial user via userconf.txt.
  PI_SSH_KEY / PI_SSH_KEY_FILE         Seed authorized_keys for first boot.
  PI_TIMEZONE / PI_LOCALE              Set timezone and default locale.
  PI_KEYBOARD_*                        Override keyboard model/layout/variant.
USAGE
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found." >&2
    exit 1
  fi
}

ensure_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "Error: this script must be run as root." >&2
    exit 1
  fi
}

confirm_device() {
  local dev=$1
  if [[ ! -b "$dev" ]]; then
    echo "Error: '$dev' is not a valid block device." >&2
    usage
  fi
  if lsblk -nr -o MOUNTPOINT "$dev" | grep -qE '\S'; then
    echo "Error: device $dev has mounted partitions. Unmount them and retry." >&2
    exit 1
  fi
}

append_if_missing() {
  local pattern=$1
  local line=$2
  local file=$3
  if ! grep -qE "^${pattern}(=|$)" "$file"; then
    printf '%s\n' "$line" >>"$file"
  fi
}

set_or_append_kv() {
  local key=$1
  local value=$2
  local file=$3
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$file"
  else
    printf '%s="%s"\n' "$key" "$value" >>"$file"
  fi
}

hash_password() {
  local password=$1
  require_cmd openssl
  openssl passwd -6 "$password"
}

cleanup() {
  local status=$?
  set +e
  if [[ -n "${BOOT_MNT:-}" ]] && mountpoint -q "$BOOT_MNT"; then
    umount "$BOOT_MNT"
  fi
  if [[ -n "${ROOT_MNT:-}" ]] && mountpoint -q "$ROOT_MNT"; then
    umount "$ROOT_MNT"
  fi
  [[ -n "${BOOT_MNT:-}" ]] && rm -rf "$BOOT_MNT"
  [[ -n "${ROOT_MNT:-}" ]] && rm -rf "$ROOT_MNT"
  [[ -n "${WORKDIR:-}" ]] && rm -rf "$WORKDIR"
  exit $status
}

main() {
  ensure_root

  if [[ -z "$DEVICE" ]]; then
    usage
  fi

  require_cmd curl
  require_cmd xzcat
  require_cmd dd
  require_cmd partprobe
  require_cmd lsblk
  require_cmd mount
  require_cmd umount
  require_cmd sed
  require_cmd install

  confirm_device "$DEVICE"

  echo "== BlackRoad OS build on $DEVICE =="

  WORKDIR=$(mktemp -d)
  trap cleanup EXIT
  cd "$WORKDIR"

  echo "Downloading base Raspberry Pi OS…"
  curl -L "$IMG_URL" -o raspios.img.xz

  echo "Writing image… (this wipes $DEVICE)"
  xzcat raspios.img.xz | dd of="$DEVICE" bs=8M status=progress conv=fsync
  sync
  partprobe "$DEVICE"

  local suffix=""
  case "$DEVICE" in
    *[0-9]) suffix="p" ;;
  esac
  local bootpart="${DEVICE}${suffix}1"
  local rootpart="${DEVICE}${suffix}2"

  if [[ ! -b "$bootpart" || ! -b "$rootpart" ]]; then
    echo "Error: expected partitions $bootpart and $rootpart not found." >&2
    exit 1
  fi

  BOOT_MNT=$(mktemp -d)
  ROOT_MNT=$(mktemp -d)

  echo "Mounting boot partition $bootpart"
  mount "$bootpart" "$BOOT_MNT"

  local config_txt
  if [[ -f "$BOOT_MNT/config.txt" ]]; then
    config_txt="$BOOT_MNT/config.txt"
  elif [[ -f "$BOOT_MNT/firmware/config.txt" ]]; then
    config_txt="$BOOT_MNT/firmware/config.txt"
  else
    echo "Error: unable to locate config.txt on boot partition." >&2
    exit 1
  fi

  echo "Patching config.txt…"
  append_if_missing "usb_max_current_enable" "usb_max_current_enable=1" "$config_txt"
  append_if_missing "hdmi_safe" "hdmi_safe=1" "$config_txt"
  append_if_missing "hdmi_force_hotplug" "hdmi_force_hotplug=1" "$config_txt"

  echo "Enabling SSH…"
  touch "$BOOT_MNT/ssh"

  if [[ -n "$WIFI_SSID" || -n "$WIFI_PSK" ]]; then
    if [[ -n "$WIFI_SSID" && -n "$WIFI_PSK" ]]; then
      echo "Configuring Wi-Fi credentials…"
      cat >"$BOOT_MNT/wpa_supplicant.conf" <<WPA
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=${WIFI_COUNTRY}

network={
    ssid="${WIFI_SSID}"
    psk="${WIFI_PSK}"
}
WPA
    else
      echo "Warning: WIFI_SSID or WIFI_PSK missing; skipping Wi-Fi configuration." >&2
    fi
  fi

  local auth_keys="${PI_SSH_KEY}" file_keys
  if [[ -n "$PI_SSH_KEY_FILE" ]]; then
    if [[ -f "$PI_SSH_KEY_FILE" ]]; then
      file_keys=$(<"$PI_SSH_KEY_FILE")
      if [[ -n "$auth_keys" && -n "$file_keys" ]]; then
        auth_keys+=$'\n'
      fi
      auth_keys+="$file_keys"
    else
      echo "Warning: PI_SSH_KEY_FILE '$PI_SSH_KEY_FILE' not found; skipping." >&2
    fi
  fi

  if [[ -n "${auth_keys//[$'\n\r\t ']}" ]]; then
    echo "Seeding SSH authorized_keys…"
    mkdir -p "$BOOT_MNT/ssh"
    printf '%s\n' "$auth_keys" >"$BOOT_MNT/ssh/authorized_keys"
  fi

  local effective_user="$PI_USER"
  if [[ -z "$effective_user" && ( -n "$PI_PASSWORD" || -n "$PI_PASSWORD_HASH" ) ]]; then
    effective_user="pi"
  fi
  if [[ -n "$effective_user" ]]; then
    local password_hash="$PI_PASSWORD_HASH"
    if [[ -z "$password_hash" && -n "$PI_PASSWORD" ]]; then
      password_hash=$(hash_password "$PI_PASSWORD")
    fi
    if [[ -n "$password_hash" ]]; then
      echo "Writing userconf.txt for $effective_user…"
      printf '%s:%s\n' "$effective_user" "$password_hash" >"$BOOT_MNT/userconf.txt"
    else
      echo "Warning: PI_USER set without PI_PASSWORD/PI_PASSWORD_HASH; skipping userconf." >&2
    fi
  fi

  if [[ -f "$SCRIPT_DIR/blackroad-firstboot.sh" ]]; then
    echo "Copying first-boot helper script…"
    install -m 0755 "$SCRIPT_DIR/blackroad-firstboot.sh" "$BOOT_MNT/blackroad-firstboot.sh"
  fi

  umount "$BOOT_MNT"

  echo "Mounting root partition $rootpart"
  mount "$rootpart" "$ROOT_MNT"

  echo "Setting hostname to $HOSTNAME…"
  printf '%s\n' "$HOSTNAME" >"$ROOT_MNT/etc/hostname"
  if grep -q "^127\.0\.1\.1" "$ROOT_MNT/etc/hosts"; then
    sed -i "s/^127\.0\.1\.1\s\+.*/127.0.1.1\t$HOSTNAME/" "$ROOT_MNT/etc/hosts"
  else
    printf '127.0.1.1\t%s\n' "$HOSTNAME" >>"$ROOT_MNT/etc/hosts"
  fi

  echo "Installing custom MOTD…"
  cat <<'MOTD' >"$ROOT_MNT/etc/motd"
##################################
   Welcome to BlackRoad OS
   (built on Raspberry Pi OS)
##################################
MOTD

  if [[ -n "$PI_TIMEZONE" ]]; then
    local tz_source="$ROOT_MNT/usr/share/zoneinfo/$PI_TIMEZONE"
    if [[ -f "$tz_source" ]]; then
      echo "Setting timezone to $PI_TIMEZONE…"
      printf '%s\n' "$PI_TIMEZONE" >"$ROOT_MNT/etc/timezone"
      cp "$tz_source" "$ROOT_MNT/etc/localtime"
    else
      echo "Warning: timezone '$PI_TIMEZONE' not found in image; skipping." >&2
    fi
  fi

  if [[ -n "$PI_LOCALE" ]]; then
    echo "Configuring locale $PI_LOCALE…"
    cat >"$ROOT_MNT/etc/default/locale" <<LOCALE
LANG=${PI_LOCALE}
LC_ALL=${PI_LOCALE}
LOCALE
    if [[ -f "$ROOT_MNT/etc/locale.gen" ]]; then
      if grep -q "^#\s*${PI_LOCALE} " "$ROOT_MNT/etc/locale.gen"; then
        sed -i "s/^#\s*${PI_LOCALE} /${PI_LOCALE} /" "$ROOT_MNT/etc/locale.gen"
      elif ! grep -q "^${PI_LOCALE} " "$ROOT_MNT/etc/locale.gen"; then
        printf '%s UTF-8\n' "$PI_LOCALE" >>"$ROOT_MNT/etc/locale.gen"
      fi
    fi
  fi

  if [[ -n "$PI_KEYBOARD_LAYOUT" || -n "$PI_KEYBOARD_VARIANT" || -n "$PI_KEYBOARD_MODEL" ]]; then
    local keyboard_cfg="$ROOT_MNT/etc/default/keyboard"
    if [[ -f "$keyboard_cfg" ]]; then
      echo "Applying keyboard layout overrides…"
      [[ -n "$PI_KEYBOARD_MODEL" ]] && set_or_append_kv "XKBMODEL" "$PI_KEYBOARD_MODEL" "$keyboard_cfg"
      [[ -n "$PI_KEYBOARD_LAYOUT" ]] && set_or_append_kv "XKBLAYOUT" "$PI_KEYBOARD_LAYOUT" "$keyboard_cfg"
      if [[ -n "$PI_KEYBOARD_VARIANT" ]]; then
        set_or_append_kv "XKBVARIANT" "$PI_KEYBOARD_VARIANT" "$keyboard_cfg"
      fi
    else
      echo "Warning: keyboard config not found; skipping layout overrides." >&2
    fi
  fi

  umount "$ROOT_MNT"

  echo "Boot order will be set to $BOOT_ORDER on first boot."
  echo "Run blackroad-firstboot.sh on the Pi to apply EEPROM changes."
  echo "Done."
}

main "$@"
