#!/usr/bin/env bash
set -euo pipefail

BOOT="/boot"
[ -f /boot/firmware/cmdline.txt ] && BOOT="/boot/firmware"
CMD="$BOOT/cmdline.txt"

[ -f "$CMD" ] || { echo "❌ No cmdline.txt found"; exit 1; }

echo "== Checking rootfs target from $CMD =="

ROOT=$(awk '{for(i=1;i<=NF;i++) if ($i ~ /^root=/){print $i; exit}}' "$CMD" | cut -d= -f2)
[ -n "$ROOT" ] || { echo "❌ No root= found"; exit 1; }
echo "root= → $ROOT"

if [[ "$ROOT" =~ ^PARTUUID= ]]; then
  WANT=${ROOT#PARTUUID=}
  echo "Looking for PARTUUID=$WANT …"
  DEV=$(blkid -t "PARTUUID=$WANT" -o device || true)
  if [ -z "$DEV" ]; then
    echo "❌ PARTUUID $WANT not present on any attached drive."
    exit 1
  else
    echo "Found at $DEV"
  fi
else
  DEV="$ROOT"
  echo "Treating root as device path $DEV"
fi

echo "Mounting $DEV read-only…"
MP=$(mktemp -d)
if mount -o ro "$DEV" "$MP" 2>/dev/null; then
  if [ -f "$MP/etc/os-release" ]; then
    . "$MP/etc/os-release"
    echo "✅ Rootfs looks good: $NAME $VERSION"
  else
    echo "⚠️  Mounted but no /etc/os-release — may not be a Linux rootfs"
  fi
  umount "$MP"
else
  echo "❌ Could not mount $DEV"
fi
rmdir "$MP"
