# BlackRoad OS Kiosk Mode

Kiosk mode launches Chromium in full-screen mode pointing at the local BlackRoad UI (`http://localhost`). It is optional and disabled by default.

## Prerequisites

- Set `BR_KIOSK=true` before running `os/install.sh` to automatically install kiosk dependencies (Chromium, X.Org, Openbox, unclutter).
- Create a dedicated user (e.g., `blackroad`) that will run the kiosk session.
- Enable console autologin for that user via `/etc/systemd/system/getty@tty1.service.d/autologin.conf`.

## Enabling kiosk mode

1. Ensure dependencies are installed (`BR_KIOSK=true ./install.sh`).
2. Copy `os/kiosk/start-kiosk.sh` to `/opt/blackroad/os/kiosk/start-kiosk.sh` (handled by installer).
3. As the kiosk user, enable the systemd **user** service:
   ```bash
   systemctl --user enable --now blackroad-kiosk.service
   ```
4. Reboot the Pi. The user will auto-login and launch Chromium in kiosk mode.

## Disabling kiosk mode

```bash
systemctl --user disable --now blackroad-kiosk.service
```

## Customisation

- Change the target URL by setting `KIOSK_URL` in the kiosk user's environment (e.g., add to `~/.profile`).
- Adjust window size with `KIOSK_WINDOW_SIZE` (default `1920,1080`).
- To hide the mouse pointer, ensure `unclutter` is installed and add `unclutter -idle 0` to the kiosk autostart script.
- For screen rotation, add `display_lcd_rotate=<value>` to `/boot/config.txt` or use `xrandr` in the autostart script.

## Crash recovery

The systemd service restarts Chromium if it exits unexpectedly. Use `journalctl --user -u blackroad-kiosk.service` to view logs.

## Security considerations

- Kiosk mode disables browser UI chrome; exit via `Ctrl+Alt+Backspace` or switching TTYs.
- Ensure the kiosk user has minimal privileges and cannot access sensitive files.
# Kiosk
- Create a user `blackroad` (no sudo), log in once to create a user session.
- Enable lingering: `loginctl enable-linger blackroad`
- As that user: `systemctl --user enable --now blackroad-kiosk.service`
- HDMI boots straight into http://localhost
