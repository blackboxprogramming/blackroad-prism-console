#!/usr/bin/env bash
# Purpose: Ensure NGINX is correctly serving BlackRoad.io and proxying /api + /ws,
# then run full health checks for site, API, and WebSocket.

set -euo pipefail

SITE_ROOT="/var/www/blackroad"
NGX_AVAIL="/etc/nginx/sites-available/blackroad.io"
NGX_ENABLED="/etc/nginx/sites-enabled/blackroad.io"
API_URL="http://127.0.0.1:4000"
SITE_URL_LOCAL="http://127.0.0.1"
SITE_URL_EXT="http://blackroad.io"   # DNS must already point here

echo "==> Install nginx if missing"
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y nginx
fi

echo "==> Ensure site artifacts exist"
mkdir -p "$SITE_ROOT"
# If CI already synced a build, this is a no-op. Otherwise drop a minimal index
[ -f "$SITE_ROOT/index.html" ] || cat > "$SITE_ROOT/index.html" <<'HTML'
<!doctype html><meta charset="utf-8"><title>BlackRoad.io</title>
<body style="background:#0b0b10;color:#e8e8f0;font:16px system-ui;-webkit-font-smoothing:antialiased">
<h1>BlackRoad.io</h1><p>Serving static root from /var/www/blackroad</p>
</body>
HTML

echo "==> Write nginx vhost config (proxy /api + /ws, SPA fallback)"
cat > "$NGX_AVAIL" <<'NGINX'
server {
  listen 80;
  listen [::]:80;
  server_name blackroad.io www.blackroad.io;

  root /var/www/blackroad;
  index index.html;

  # Single-page app fallback (keeps /status, /portal working)
  location / {
    try_files $uri /index.html;
  }

  # API proxy to Node bridge on :4000
  location /api/ {
    proxy_pass http://127.0.0.1:4000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket proxy to /ws (HTTP/1.1 Upgrade)
  location /ws {
    proxy_pass http://127.0.0.1:4000/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
NGINX

echo "==> Enable vhost"
ln -sf "$NGX_AVAIL" "$NGX_ENABLED"

echo "==> Config test + reload"
nginx -t
systemctl reload nginx || systemctl restart nginx

echo "==> Basic service status"
systemctl is-active nginx || (echo "nginx not active"; exit 1)

echo "==> API health probe (bridge must be running on :4000)"
if curl -fsS "$API_URL/api/health.json" >/dev/null; then
  echo "API OK @ $API_URL/api/health.json"
else
  echo "WARN: API not responding on $API_URL"
fi

echo "==> Site root probe (local loopback)"
curl -fsS -I "$SITE_URL_LOCAL" | head -1

echo "==> Site essential routes (static & SPA)"
for p in "/" "/status" "/portal" "/docs"; do
  code=$(curl -o /dev/null -s -w "%{http_code}" "$SITE_URL_LOCAL$p")
  printf "  %-8s -> %s\n" "$p" "$code"

done

echo "==> External hostname (requires DNS):"
code_ext=$(curl -o /dev/null -s -w "%{http_code}" "$SITE_URL_EXT" || true)
echo "  $SITE_URL_EXT -> ${code_ext:-NA}"

echo "==> WebSocket handshake probe"
# Minimal HTTP/1.1 upgrade request using curl
WS_HEADERS=$(cat <<'HDR'
GET /ws HTTP/1.1
Host: 127.0.0.1
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
Sec-WebSocket-Version: 13

HDR
)
# Use netcat or /dev/tcp to send the handshake
if command -v nc >/dev/null 2>&1; then
  printf "%s" "$WS_HEADERS" | nc 127.0.0.1 80 -w 2 | head -3 || true
else
  exec 3<>/dev/tcp/127.0.0.1/80 || true
  printf "%s" "$WS_HEADERS" >&3 || true
  head -3 <&3 || true
  exec 3<&- 3>&- || true
fi

echo "==> Tail last nginx error lines (if any)"
tail -n 50 /var/log/nginx/error.log || true

echo "==> Done. If any probe failed, check the API service and DNS."
