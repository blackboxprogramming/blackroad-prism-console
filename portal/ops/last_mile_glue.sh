#!/usr/bin/env bash
#
# Apply the final Raspberry Pi automation glue:
#   * Log rotation for ~/portal/logs
#   * Nightly proof regeneration via cron
#   * Localhost REST shim + optional systemd unit
#
set -euo pipefail
ROOT="/home/pi/portal"
mkdir -p "$ROOT/bin" "$ROOT/logs" "$ROOT/reports" "$ROOT/proofs" "$ROOT/configs"

# logrotate configuration (retain 14 days)
sudo cp "$PWD/../configs/logrotate.portal" /etc/logrotate.d/portal

# nightly proofs wrapper
install -m 0755 "$PWD/../bin/portal-nightly" "$ROOT/bin/portal-nightly"
( crontab -l 2>/dev/null | grep -v 'portal-nightly' ; echo "17 2 * * * /home/pi/portal/bin/portal-nightly" ) | crontab -

# REST shim token setup
TOKEN_FILE="$ROOT/configs/api.token"
if [ ! -s "$TOKEN_FILE" ]; then
  head -c 24 /dev/urandom | base64 > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
fi

# REST shim + systemd unit
install -m 0755 "$PWD/../bin/portal-rest" "$ROOT/bin/portal-rest"
sudo install -m 0644 "$PWD/../systemd/portal-rest.service" /etc/systemd/system/portal-rest.service
sudo systemctl daemon-reload

echo "Logrotate, nightly cron, and REST shim deployed."
echo "Token: $(cat "$TOKEN_FILE")"
echo "Start REST service with: sudo systemctl enable --now portal-rest.service"
