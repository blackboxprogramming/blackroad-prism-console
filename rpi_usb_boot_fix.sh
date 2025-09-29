#!/usr/bin/env bash
set -euo pipefail

bold(){ printf "\033[1m%s\033[0m\n" "$*"; }
ok(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*" >&2; }
die(){ printf "❌ %s\n" "$*" >&2; exit 1; }

# --- options ---------------------------------------------------------------
SAFE_VIDEO=0   # set to 1 to also force hdmi_safe/hotplug
while (( $# )); do
  case "$1" in
    --safe-video) SAFE_VIDEO=1;;
    *) die "Unknown arg: $1";;
  esac; shift
done

[ "$EUID" -eq 0 ] || die "Run with sudo."

bold "Scanning for Raspberry Pi boot partition…"

# List all partitions except the Jetson's root device
ROOTDEV=$(findmnt -no SOURCE / | sed 's/[0-9]*$//')
mapfile -t PARTS < <(lsblk -rno NAME,TYPE | awk '$2=="part"{print "/dev/"$1}')
CANDIDATES=()

for p in "${PARTS[@]}"; do
  [[ "$p" == $ROOTDEV* ]] && continue
  # Quick probe: try to mount read-only and look for Pi boot files
  mp=$(mktemp -d)
  if mount -o ro "$p" "$mp" 2>/dev/null; then
    if [[ -f "$mp/cmdline.txt" && -f "$mp/config.txt" ]] && ls "$mp"/start*.elf >/dev/null 2>&1; then
      CANDIDATES+=("$p:$mp")
    fi
    umount "$mp" || true
  fi
  rmdir "$mp" || true
done

((${#CANDIDATES[@]})) || die "No Raspberry Pi boot partitions found."

# If more than one, pick the first. (You can edit below to pick interactively.)
IFS=':' read -r BOOTPART TMP <<<"${CANDIDATES[0]}"
bold "Using boot partition: $BOOTPART"

# Mount RW now
BOOTMNT=$(mktemp -d)
mount "$BOOTPART" "$BOOTMNT"

CFG="$BOOTMNT/config.txt"
CMD="$BOOTMNT/cmdline.txt"
[[ -f "$CFG" && -f "$CMD" ]] || { umount "$BOOTMNT"; rmdir "$BOOTMNT"; die "Missing config.txt or cmdline.txt on $BOOTPART"; }

cp -n "$CFG" "$CFG.bak.$(date +%Y%m%d-%H%M%S)"
ok "Backed up config.txt → $(basename "$CFG").bak.*"

# Ensure usb_max_current_enable=1
if grep -q '^usb_max_current_enable=' "$CFG"; then
  sed -i 's/^usb_max_current_enable=.*/usb_max_current_enable=1/' "$CFG"
else
  echo "usb_max_current_enable=1" >> "$CFG"
fi
ok "Set usb_max_current_enable=1"

# Optional safe video
if (( SAFE_VIDEO )); then
  grep -q '^hdmi_force_hotplug=' "$CFG" || echo "hdmi_force_hotplug=1" >> "$CFG"
  if grep -q '^hdmi_safe=' "$CFG"; then
    sed -i 's/^hdmi_safe=.*/hdmi_safe=1/' "$CFG"
  else
    echo "hdmi_safe=1" >> "$CFG"
  fi
  ok "Enabled hdmi_safe=1 and hdmi_force_hotplug=1"
fi

sync

# Try to locate a plausible rootfs and validate PARTUUID in cmdline
bold "Checking rootfs…"
ROOTUUID=$(awk -F'root=| ' '{for(i=1;i<=NF;i++) if ($i ~ /^root=/) print $(i+0)}' "$CMD" | sed 's/root=//')
if [[ -z "$ROOTUUID" ]]; then
  warn "No root=… in cmdline.txt (unusual)."
else
  if [[ "$ROOTUUID" =~ ^PARTUUID= ]]; then
    WANT=${ROOTUUID#PARTUUID=}
    HAVE=$(blkid -s PARTUUID -o value "${BOOTPART%[0-9]*}"* 2>/dev/null | tr '[:upper:]' '[:lower:]' )
    if echo "$HAVE" | grep -qi "^${WANT,,}$"; then
      ok "cmdline.txt PARTUUID points to an attached partition."
    else
      warn "cmdline.txt PARTUUID ($WANT) not found among attached devices."
      warn "You may have imaged the disk but partition UUIDs changed."
    fi
  else
    warn "cmdline root= is '$ROOTUUID' (not a PARTUUID form)."
  fi
fi

# Try to guess rootfs presence by mounting siblings with ext4 and checking /etc/os-release
bold "Looking for a Linux root partition…"
FOUND=0
for p in "${PARTS[@]}"; do
  [[ "$p" == $ROOTDEV* ]] && continue
  [[ "$p" == "$BOOTPART" ]] && continue
  FSTYPE=$(lsblk -no FSTYPE "$p" 2>/dev/null || true)
  [[ "$FSTYPE" == "ext4" || "$FSTYPE" == "ext3" ]] || continue
  mp=$(mktemp -d)
  if mount -o ro "$p" "$mp" 2>/dev/null; then
    if [[ -f "$mp/etc/os-release" ]]; then
      . "$mp/etc/os-release"
      ok "Found rootfs on $p → $NAME $VERSION"
      FOUND=1
      umount "$mp"
      rmdir "$mp"
      break
    fi
    umount "$mp" || true
  fi
  rmdir "$mp" || true
done
((FOUND)) || warn "Did not positively identify a rootfs partition. The drive may not be fully imaged."

umount "$BOOTMNT"; rmdir "$BOOTMNT"

bold "Done."
echo
echo "➡  You can now move the drive back to the Pi 5 and try booting."
echo "    - usb_max_current_enable=1 is set."
(( SAFE_VIDEO )) && echo "    - hdmi_safe/hotplug are enabled (you can remove later)."
