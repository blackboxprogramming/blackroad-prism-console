# Raspberry Pi 5 Fast Flash from Jetson Workstation

This runbook captures the "chaos mode" recovery flow for getting a Raspberry Pi 5
back to a clean Raspberry Pi OS Lite boot using a Jetson as the flashing
workstation. It also bakes in the higher USB power limit so that attached
peripherals are stable on first boot.

## Prerequisites
- Jetson device running Ubuntu with `curl`, `xz-utils`, and `dd` available.
- Target storage for the Pi (USB SSD or SD card via reader) attached to the Jetson.
- Network path between the Pi and Jetson (direct Ethernet or via a switch/router).
- Raspberry Pi 5 with a reliable USB-C power supply (27 W official supply
  recommended).

> **Safety tip:** Double-check the device path you are about to overwrite. Use
> `lsblk` and verify capacity and model before running `dd`.

## Flash Raspberry Pi OS Lite (64-bit)
1. Open a terminal on the Jetson and list block devices:
   ```bash
   lsblk -o NAME,SIZE,MODEL
   ```
   Identify the removable drive (e.g., `/dev/sdX` for USB SSD or
   `/dev/mmcblkX` for SD cards). Replace `X` with the actual letter or number in
   the commands below.
2. Create a workspace and download the latest Raspberry Pi OS Lite (arm64)
   image:
   ```bash
   mkdir -p ~/pi-os && cd ~/pi-os
   curl -LO https://downloads.raspberrypi.com/raspios_lite_arm64_latest
   ```
   You can skip the download if you already have a current image file.
3. Write the image directly using `xzcat` piped to `dd` for speed:
   ```bash
   xzcat raspios_lite_arm64_latest | sudo dd of=/dev/sdX bs=8M status=progress conv=fsync
   sync
   ```

## Enable USB Power Boost and Safe Video Mode
1. Re-read the partition table and mount the boot partition:
   ```bash
   sudo partprobe /dev/sdX
   sudo mkdir -p /mnt/boot
   sudo mount /dev/sdX1 /mnt/boot
   ```
2. Append boot configuration tweaks to guarantee a low-friction first boot:
   ```bash
   echo "usb_max_current_enable=1" | sudo tee -a /mnt/boot/config.txt
   echo "hdmi_safe=1" | sudo tee -a /mnt/boot/config.txt
   echo "hdmi_force_hotplug=1" | sudo tee -a /mnt/boot/config.txt
   ```
   - `usb_max_current_enable=1`: raises the available power budget for USB
     devices.
   - `hdmi_safe=1`: forces a conservative HDMI mode so boot firmware will render
     reliably even with finicky displays.
   - `hdmi_force_hotplug=1`: guarantees HDMI0 stays active even without a monitor
     detected during boot (optional but useful for single-display setups).
3. Enable headless SSH access:
   ```bash
   sudo touch /mnt/boot/ssh
   sudo sync
   sudo umount /mnt/boot
   ```

## First Boot Checklist
- Connect a single monitor to HDMI0 (the port closest to the USB-C power
  connector) and leave HDMI1 disconnected initially.
- Plug Ethernet into the Pi. For a direct Pi ↔ Jetson link, configure a static IP
  on the Jetson or enable Internet sharing; using a switch or router is simpler.
- Power the Pi with the high-wattage supply and leave USB peripherals unplugged
  until the system reaches a login prompt.
- After confirming a stable boot, remove `hdmi_safe=1` from `config.txt` to
  restore normal resolution.

## Optional: Netboot From the Jetson
If you want to explore netbooting instead of flashing local storage:
1. Ensure Pi and Jetson share the same Ethernet network.
2. On the Jetson install the required services:
   ```bash
   sudo apt update
   sudo apt install -y dnsmasq tftpd-hpa nfs-kernel-server
   ```
3. Configure `dnsmasq` for TFTP (proxy DHCP if another device provides DHCP),
   place the Pi boot files under `/srv/tftp`, export a root filesystem from
   `/srv/nfs/pi-root`, and update the Pi's `cmdline.txt` to include `root=/dev/nfs`
   with the appropriate `nfsroot=` parameters.

This path is more complex but useful for lab environments where you want rapid
recovery or diskless operation.

## Troubleshooting Notes
- **Dual-display confusion:** Firmware prefers HDMI0. If you see bootloader logs
  on one display and the OS login on another, ensure HDMI0 hosts the main
  monitor during setup.
- **Stuck at the rainbow splash bar:** Usually a display mode mismatch or
  corrupted image. Keeping `hdmi_safe=1` for the first boot eliminates most
  issues.
- **Power instability:** With `usb_max_current_enable=1` set and peripherals
  disconnected, the Pi should consistently reach the login prompt. Add USB
  devices after confirming the system is stable.

Follow this playbook whenever you need a rapid, known-good Raspberry Pi 5 boot
from a Jetson workstation.
