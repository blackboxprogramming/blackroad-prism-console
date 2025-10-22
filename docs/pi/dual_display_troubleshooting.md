# Raspberry Pi Dual-Display Troubleshooting

When one monitor shows the Linux desktop while another stays on the bootloader screen, the Pi has finished booting but the firmware is mirroring diagnostics on the wrong port. Use the steps below to make sure the intended display is treated as HDMI0 and to bring the second display online once the OS is running.

## 1. Confirm the Primary HDMI Port

1. Power the Pi down.
2. Plug the display you want as the main screen into the **left micro-HDMI port (HDMI0)** — the port closest to the USB-C power connector on Pi 4/5 boards.
3. Disconnect any other HDMI cables and power the Pi back on.
4. Verify that the firmware splash and desktop now appear on that screen.

> The bootloader always prefers HDMI0. If another monitor is connected to HDMI1, it may capture the boot logs even though the OS continues to load on HDMI0.

## 2. Bring Up the Desktop and Arrange Displays

Once the Pi reaches the desktop:

1. Reconnect the second monitor to the **right micro-HDMI port (HDMI1)**.
2. Open **Settings → Display** (Raspberry Pi OS) and choose the layout you want (mirrored or extended).
3. Apply the changes and confirm that both displays update.

## 3. Force HDMI Detection When a Screen Stays Blank

If one display still shows no signal after the desktop loads:

1. Open a terminal or SSH session.
2. Edit the boot configuration:

   ```bash
   sudo nano /boot/firmware/config.txt    # Raspberry Pi OS Bookworm
   # or
   sudo nano /boot/config.txt             # Raspberry Pi OS Bullseye and earlier
   ```

3. Add (or uncomment) the following lines near the end of the file for the affected port:

   ```text
   hdmi_force_hotplug=1
   hdmi_drive=2
   ```

4. Optional: set an explicit resolution if the monitor is picky (example for 1080p @ 60 Hz):

   ```text
   hdmi_group=2
   hdmi_mode=82
   ```

5. Save the file, exit the editor, and reboot:

   ```bash
   sudo reboot
   ```

## 4. Verify Which Display the Pi Thinks Is Primary

If you are still unsure which output is active:

1. Check display detection with `xrandr` (when running the desktop):

   ```bash
   xrandr --query
   ```

   Look for `connected primary` next to the port identifier (e.g., `HDMI-1` for HDMI0 on Pi 4).

2. For headless verification, use `vcgencmd`:

   ```bash
   vcgencmd dispmanx_list
   ```

   The list shows the active display stack and which HDMI pipe is in use.

## 5. Boot Media Checks When the Wrong Screen Shows Boot Logs

Seeing the EEPROM diagnostics on one display while the other runs the desktop generally means the Pi already booted successfully. If you need to confirm the OS that is running:

- `htop` (or `top`) will show active processes, CPU load, and temperature sensors.
- `lsblk` identifies the storage device that was used to boot (SD card vs. USB SSD).

Re-seat the HDMI cables or repeat steps 1–3 if you move the Pi between different monitors.
