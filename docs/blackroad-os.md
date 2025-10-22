# BlackRoad OS Image Builder

This repository includes helper scripts for preparing a Raspberry Pi OS Lite image
with BlackRoad defaults and a first-boot helper for finalizing EEPROM settings on
the Raspberry Pi itself.

## Prerequisites

- A Linux workstation (e.g., the Jetson) with `curl`, `xzcat`, `dd`, `partprobe`,
  and standard GNU core utilities available.
- Root access (`sudo`) to write directly to the target block device.
- An SD card or USB drive visible under `/dev/`.

## Flashing the Image

```bash
cd scripts
chmod +x blackroad-build.sh
sudo ./blackroad-build.sh /dev/sdX
```

Replace `/dev/sdX` with the block device that maps to your removable media. The
script will download the latest Raspberry Pi OS Lite image, flash it to the
specified device, and apply the following customizations:

- Enable USB high-current mode and conservative HDMI defaults in `config.txt`.
- Enable the SSH service by default.
- Set the hostname to `blackroad` and configure `/etc/hosts` accordingly.
- Install a custom login banner (MOTD).
- Drop `blackroad-firstboot.sh` on the boot partition for later use.

The operation is destructive and will wipe the target device.

## Optional Configuration (Pi 400 Keyboard Defaults)

The builder now accepts environment variables so you can pre-seed settings that
match the Raspberry Pi 400 keyboard computer out of the box:

| Variable | Purpose |
| --- | --- |
| `WIFI_SSID` / `WIFI_PSK` / `WIFI_COUNTRY` | Create `wpa_supplicant.conf` on the boot partition so the Pi joins Wi-Fi immediately. |
| `PI_USER`, `PI_PASSWORD` or `PI_PASSWORD_HASH` | Provision the first user via `userconf.txt`. The plain password is hashed with `openssl` before writing. |
| `PI_SSH_KEY` / `PI_SSH_KEY_FILE` | Seed SSH `authorized_keys` during imaging (keys are placed under `/boot/ssh/authorized_keys`). |
| `PI_TIMEZONE` | Write `/etc/timezone` and `/etc/localtime` to match your region (e.g., `America/Los_Angeles`). |
| `PI_LOCALE` | Sets `/etc/default/locale` and ensures the locale is enabled in `locale.gen`. |
| `PI_KEYBOARD_MODEL`, `PI_KEYBOARD_LAYOUT`, `PI_KEYBOARD_VARIANT` | Update `/etc/default/keyboard` so the integrated keyboard layout matches your locale. |

Example invocation for a Pi 400 destined for a US-based ops bench:

```bash
sudo WIFI_SSID="BlackRoadHQ" \
  WIFI_PSK="super-secret" \
  PI_USER=blackroad \
  PI_PASSWORD='change-me-now' \
  PI_SSH_KEY_FILE="$HOME/.ssh/id_ed25519.pub" \
  PI_TIMEZONE=America/Los_Angeles \
  PI_LOCALE=en_US.UTF-8 \
  PI_KEYBOARD_LAYOUT=us \
  ./blackroad-build.sh /dev/sdX
```

Any variables you leave unset fall back to Raspberry Pi OS defaults.

## First-Boot Finalization

After the Raspberry Pi boots from the prepared media:

1. Log in via console or SSH.
2. Run the bundled helper (already copied to `/boot/blackroad-firstboot.sh`):

   ```bash
   sudo /boot/blackroad-firstboot.sh
   ```

   The script removes the temporary HDMI safe-mode overrides and programs the
   EEPROM boot order to `0xf14` (USB → SD). A reboot is recommended once it
   completes.

3. Optionally delete the helper script after use:

   ```bash
   sudo rm /boot/blackroad-firstboot.sh
   ```

The EEPROM update step must be executed directly on the Raspberry Pi because the
EEPROM is not accessible when the storage is attached to another machine.
