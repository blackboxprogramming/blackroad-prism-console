#!/usr/bin/env bash
set -euo pipefail

# --- knobs you can tweak ---
IMG_URL="https://downloads.raspberrypi.com/raspios_lite_arm64_latest"
DEVICE="${1:-}"   # e.g. /dev/sdX
SAFE_VIDEO=1      # add hdmi_safe=1 on first boot
ENABLE_SSH=1      # create ssh file on boot partition

usage(){ echo "Usage: sudo $0 /dev/sdX"; exit 1; }
[ -b "$DEVICE" ] || usage

echo "== Codex reflash starting =="
WORKDIR=$(mktemp -d)
cd "$WORKDIR"

echo "Downloading image…"
curl -L "$IMG_URL" -o raspios.img.xz

echo "Writing to $DEVICE (this will erase it)…"
xzcat raspios.img.xz | dd of="$DEVICE" bs=8M status=progress conv=fsync
sync

echo "Re-reading partitions…"
partprobe "$DEVICE"

# Find boot partition (first partition)
BOOTPART="${DEVICE}1"
mount "$BOOTPART" /mnt

echo "Patching /mnt/config.txt"
if [ "$SAFE_VIDEO" -eq 1 ]; then
  echo "hdmi_safe=1" >> /mnt/config.txt
  echo "hdmi_force_hotplug=1" >> /mnt/config.txt
fi
echo "usb_max_current_enable=1" >> /mnt/config.txt

if [ "$ENABLE_SSH" -eq 1 ]; then
  touch /mnt/ssh
fi

umount /mnt
sync

echo "✅ Reflash complete. Move $DEVICE back to Pi and boot."
