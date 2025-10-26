#!/usr/bin/env bash
set -euo pipefail

# Lightweight X session launching Chromium in kiosk mode.
# This script is intended to be run via startx from the systemd user service.

: "${KIOSK_URL:=http://localhost}"
: "${KIOSK_WINDOW_SIZE:=1920,1080}"

cat <<'OPENBOX' > /tmp/blackroad-kiosk-autostart.sh
#!/usr/bin/env sh
/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-translate \
  --no-first-run --fast --fast-start --window-size=${KIOSK_WINDOW_SIZE} \
  --check-for-update-interval=31536000 --disable-session-crashed-bubble \
  --disable-infobars ${KIOSK_URL}
OPENBOX
chmod +x /tmp/blackroad-kiosk-autostart.sh

cat <<'OPENBOXRC' > /tmp/blackroad-kiosk-openbox.rc
<?xml version="1.0" encoding="UTF-8"?>
<openbox_config>
  <applications>
    <application class="*">
      <decor>no</decor>
    </application>
  </applications>
</openbox_config>
OPENBOXRC

/usr/bin/openbox-session --config-file /tmp/blackroad-kiosk-openbox.rc --startup \
  /tmp/blackroad-kiosk-autostart.sh
