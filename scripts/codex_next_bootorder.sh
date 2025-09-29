#!/usr/bin/env bash
set -euo pipefail

DESIRED="0xf14"   # USB first, then SD; change to 0xf41 for SD→USB
TMPDIR=$(mktemp -d)
CONF="$TMPDIR/bootconf.txt"
NEWCONF="$TMPDIR/bootconf.new.txt"
NEWIMG="$TMPDIR/pieeprom-new.bin"
LOG="$TMPDIR/log.txt"

log(){ echo "[$(date +'%F %T')] $*" | tee -a "$LOG"; }

command -v rpi-eeprom-config >/dev/null || { echo "rpi-eeprom-config not found"; exit 1; }
command -v rpi-eeprom-update >/dev/null || { echo "rpi-eeprom-update not found"; exit 1; }

log "Reading current EEPROM config…"
sudo rpi-eeprom-config > "$CONF"

CUR=$(grep -E '^BOOT_ORDER=' "$CONF" | head -n1 | cut -d= -f2 | tr -d '[:space:]')
[ -n "${CUR:-}" ] || { echo "Could not read BOOT_ORDER"; exit 1; }

echo
echo "Current BOOT_ORDER: $CUR"
echo "Desired BOOT_ORDER: $DESIRED"
echo

if [ "$CUR" = "$DESIRED" ]; then
  echo "Already set. No change needed."
  exit 0
fi

cp "$CONF" "$CONF.bak"
# Replace or append BOOT_ORDER
if grep -q '^BOOT_ORDER=' "$CONF"; then
  sed "s/^BOOT_ORDER=.*/BOOT_ORDER=$DESIRED/" "$CONF" > "$NEWCONF"
else
  printf "BOOT_ORDER=%s\n" "$DESIRED" >> "$CONF"
  cp "$CONF" "$NEWCONF"
fi

echo "Attempting in-place apply…"
if sudo rpi-eeprom-config --apply "$NEWCONF"; then
  echo "Applied via --apply."
else
  echo "Apply not supported here. Building new EEPROM image…"
  sudo rpi-eeprom-config --out "$NEWIMG" --config "$NEWCONF"
  ls -lh "$NEWIMG"
  echo "Flashing new EEPROM image…"
  sudo rpi-eeprom-update -d -f "$NEWIMG"
fi

echo
echo "Verifying…"
sudo rpi-eeprom-config | tee "$TMPDIR/after.txt"
NEW=$(grep -E '^BOOT_ORDER=' "$TMPDIR/after.txt" | head -n1 | cut -d= -f2 | tr -d '[:space:]')
echo "After BOOT_ORDER: $NEW"

if [ "$NEW" != "$DESIRED" ]; then
  echo "EEPROM did not reflect desired BOOT_ORDER. Check $LOG and try again."
  exit 1
fi

echo
echo "✅ Boot order updated to $NEW. Rebooting to apply…"
sudo reboot
