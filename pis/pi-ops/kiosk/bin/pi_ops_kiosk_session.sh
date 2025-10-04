#!/usr/bin/env bash
set -euo pipefail

: "${GRAFANA_URL:=http://localhost:3000/d/pi-ops-ultra/ops?orgId=1&kiosk&refresh=5s}"

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
if [ ! -d "$XDG_RUNTIME_DIR" ]; then
  mkdir -p "$XDG_RUNTIME_DIR"
  chmod 700 "$XDG_RUNTIME_DIR"
fi

# Disable screen blanking / power management.
xset -dpms || true
xset s off || true
xset s noblank || true

# Hide the cursor when idle.
if command -v unclutter >/dev/null 2>&1; then
  unclutter --timeout 0 --jitter 0 --hide-on-touch --ignore-scrolling &
  UNC_PID=$!
  trap 'kill "$UNC_PID" >/dev/null 2>&1 || true' EXIT
fi

# Launch Chromium in kiosk mode; restart if it ever exits.
while true; do
  chromium-browser \
    --kiosk \
    --app="$GRAFANA_URL" \
    --check-for-update-interval=31536000 \
    --start-maximized \
    --window-size=1600,600 \
    --noerrdialogs \
    --disable-translate \
    --overscroll-history-navigation=0 \
    --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT' \
    --incognito \
    --disable-session-crashed-bubble || true
  sleep 2
  echo "[pi-ops-kiosk] restarting chromium..." >&2
  sleep 3
done
