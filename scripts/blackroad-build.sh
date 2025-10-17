#!/usr/bin/env bash
set -euo pipefail

IMG_URL="https://downloads.raspberrypi.com/raspios_lite_arm64_latest"
DEVICE="${1:-}"
HOSTNAME="blackroad"
BOOT_ORDER="0xf14"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'USAGE'
Usage: sudo ./blackroad-build.sh /dev/sdX

This script downloads the latest Raspberry Pi OS Lite image and flashes it to the
specified block device with BlackRoad defaults applied.
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

  umount "$ROOT_MNT"

  echo "Boot order will be set to $BOOT_ORDER on first boot."
  echo "Run blackroad-firstboot.sh on the Pi to apply EEPROM changes."
  echo "Done."
}

main "$@"
