# Codex "Next!!!" Trigger Installation

This guide wires the `next!!!` signal into a Raspberry Pi so it flips the boot
order to USB-first, enables higher USB current draw, optionally pings a
webhook, and reboots. Follow these steps from an administrator shell on the Pi.

## 1. Install the handler script

Create `/usr/local/bin/codex-next.sh` with execute permissions. The script logs
to `/var/log/codex-next.log`, snapshots device information, enforces
`usb_max_current_enable=1` in `config.txt`, updates the EEPROM boot order, sends
an optional pingback, and reboots.

```bash
sudo tee /usr/local/bin/codex-next.sh >/dev/null <<'SH'
#!/usr/bin/env bash
set -euo pipefail

# --- knobs ---
PINGBACK_URL="${PINGBACK_URL:-}"     # set env var to get a POST on run
DESIRED_BOOT_ORDER="${DESIRED_BOOT_ORDER:-0xf14}"  # USB→SD; change to 0xf41 for SD→USB
LOG="/var/log/codex-next.log"

log(){ echo "[$(date +'%F %T')] $*" | tee -a "$LOG"; }

log "== codex-next start =="

# 0) quick diag snapshot
{
  echo "# uname:"; uname -a
  echo "# bootloader:"; rpi-eeprom-update || true
  echo "# eeprom conf:"; rpi-eeprom-config || true
  echo "# config ints:"; vcgencmd get_config int || true
  echo "# block:"; lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT
} >> "$LOG" 2>&1 || true

# 1) ensure usb_max_current_enable=1
BOOT="/boot"
[ -f /boot/firmware/config.txt ] && BOOT="/boot/firmware"
CFG="$BOOT/config.txt"
if [ -f "$CFG" ]; then
  sudo cp -n "$CFG" "$CFG.codex.bak.$(date +%Y%m%d-%H%M%S)" || true
  if grep -q '^usb_max_current_enable=' "$CFG"; then
    sudo sed -i 's/^usb_max_current_enable=.*/usb_max_current_enable=1/' "$CFG"
  else
    echo "usb_max_current_enable=1" | sudo tee -a "$CFG" >/dev/null
  fi
  log "Set usb_max_current_enable=1 in $CFG"
else
  log "WARN: no config.txt found at $CFG"
fi

# 2) set EEPROM BOOT_ORDER
tmpd=$(mktemp -d)
cur="$(rpi-eeprom-config 2>/dev/null | awk -F= '/^BOOT_ORDER=/{print $2; exit}' | tr -d '[:space:]')"
log "Current BOOT_ORDER: ${cur:-unknown} | Desired: $DESIRED_BOOT_ORDER"

# Build new config
rpi-eeprom-config > "$tmpd/cur.txt"
if grep -q '^BOOT_ORDER=' "$tmpd/cur.txt"; then
  sed "s/^BOOT_ORDER=.*/BOOT_ORDER=$DESIRED_BOOT_ORDER/" "$tmpd/cur.txt" > "$tmpd/new.txt"
else
  printf "BOOT_ORDER=%s\n" "$DESIRED_BOOT_ORDER" >> "$tmpd/cur.txt"
  cp "$tmpd/cur.txt" "$tmpd/new.txt"
fi

# Try apply; if not supported, build + flash
if rpi-eeprom-config --apply "$tmpd/new.txt" >>"$LOG" 2>&1; then
  log "Applied via rpi-eeprom-config --apply"
else
  log "Falling back to image build + update"
  rpi-eeprom-config --out "$tmpd/pieeprom-new.bin" --config "$tmpd/new.txt" >>"$LOG" 2>&1
  rpi-eeprom-update -d -f "$tmpd/pieeprom-new.bin" >>"$LOG" 2>&1
fi

new="$(rpi-eeprom-config 2>/dev/null | awk -F= '/^BOOT_ORDER=/{print $2; exit}' | tr -d '[:space:]')"
log "After BOOT_ORDER: ${new:-unknown}"

# 3) pingback if configured
if [ -n "$PINGBACK_URL" ]; then
  curl -s -X POST -H "Content-Type: application/json" \
    --data "{\"ts\":\"$(date -Is)\",\"action\":\"codex-next\",\"boot_order_before\":\"$cur\",\"boot_order_after\":\"$new\"}" \
    "$PINGBACK_URL" >/dev/null || log "Pingback failed"
fi

log "Rebooting to apply…"
sync
reboot
SH
sudo chmod +x /usr/local/bin/codex-next.sh
```

## 2. Register the systemd trigger

Create a oneshot service and a path unit so touching the trigger file runs the
handler. The `codex-next.service` unit wires in environment variables for the
pingback URL and desired boot order.

```bash
sudo tee /etc/systemd/system/codex-next.service >/dev/null <<'UNIT'
[Unit]
Description=Run Codex NEXT action
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=PINGBACK_URL=
Environment=DESIRED_BOOT_ORDER=0xf14
ExecStart=/usr/local/bin/codex-next.sh
UNIT

sudo tee /etc/systemd/system/codex-next.path >/dev/null <<'PATH'
[Unit]
Description=Watch NEXT trigger file

[Path]
PathChanged=/var/run/codex-next.trigger
Unit=codex-next.service

[Install]
WantedBy=multi-user.target
PATH

sudo systemctl daemon-reload
sudo systemctl enable --now codex-next.path
```

## 3. Fire the trigger

Anytime you need to run the automation, write the keyword to the trigger file
(or start the service directly):

```bash
echo "next!!!" | sudo tee /var/run/codex-next.trigger
```

The handler will enforce USB power, update `BOOT_ORDER`, and reboot. If you
need an immediate run without touching the file, start the service manually:

```bash
sudo systemctl start codex-next.service
```

## 4. Optional knobs

* **Webhook pingback** – capture events by exporting `PINGBACK_URL` into the
  systemd environment and restarting the path unit:

  ```bash
  sudo systemctl set-environment PINGBACK_URL="https://example.com/codex-ping"
  sudo systemctl restart codex-next.path
  ```

* **Prefer SD card first** – switch to SD-first boot ordering:

  ```bash
  sudo systemctl set-environment DESIRED_BOOT_ORDER=0xf41
  sudo systemctl restart codex-next.path
  ```

After the reboot, confirm the Pi came back up, review `/var/log/codex-next.log`
for the captured diagnostics, and repeat the trigger as needed.
