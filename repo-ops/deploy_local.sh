#!/usr/bin/env bash
# Path-based deploy helper (NGINX + systemd + docker compose)
set -Eeo pipefail
trap 'rc=$?; echo "ERROR ($rc) at line $LINENO: $BASH_COMMAND" >&2; exit $rc' ERR

REPO_DIR="${1:-}"
HOST_PATH="${2:-app.blackroad.io}"

if [ -z "$REPO_DIR" ]; then
  echo "Usage: $0 /opt/blackroad/work/br-<name> app.blackroad.io"
  exit 1
fi

# Detect port from Dockerfile/compose (fallback 8000)
detect_port() {
  local d="$1" p=""
  [ -f "$d/docker-compose.yml" ] && p="$(awk -F: '/ports:/ {found=1} found && /- /{gsub(/"| /,"" ); split($2,a,":"); print a[1]; exit}' "$d/docker-compose.yml")"
  [ -z "$p" ] && [ -f "$d/Dockerfile" ] && p="$(awk 'toupper($1)=="EXPOSE"{print $2;exit}' "$d/Dockerfile")"
  echo "${p:-8000}"
}

PORT="$(detect_port "$REPO_DIR")"
echo "Using internal service port: $PORT"

# Install NGINX site
install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
if [ -f "$REPO_DIR/_ops/nginx/site.conf" ]; then
  cp "$REPO_DIR/_ops/nginx/site.conf" "/etc/nginx/sites-available/${HOST_PATH}.conf"
  # replace default port in template with detected one
  sed -i "s/127.0.0.1:[0-9]\+/127.0.0.1:${PORT}/" "/etc/nginx/sites-available/${HOST_PATH}.conf"
else
  cat > "/etc/nginx/sites-available/${HOST_PATH}.conf" <<EOT
server { listen 80; server_name ${HOST_PATH}; return 301 https://\$host\$request_uri; }
server {
  listen 443 ssl http2; server_name ${HOST_PATH};
  ssl_certificate     /etc/letsencrypt/live/${HOST_PATH}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${HOST_PATH}/privkey.pem;
  location / { proxy_pass http://127.0.0.1:${PORT}; proxy_set_header Host \$host; proxy_set_header X-Forwarded-Proto \$scheme; }
}
EOT
fi
ln -sf "/etc/nginx/sites-available/${HOST_PATH}.conf" "/etc/nginx/sites-enabled/${HOST_PATH}.conf"
nginx -t
systemctl reload nginx

# Place service under /opt/app and start
rm -rf /opt/app && mkdir -p /opt/app
cp -r "$REPO_DIR"/. /opt/app/
install -d /etc/systemd/system
if [ -f "/opt/app/_ops/systemd/app.service" ]; then
  cp "/opt/app/_ops/systemd/app.service" /etc/systemd/system/app.service
else
  cat > /etc/systemd/system/app.service <<'EOT'
[Unit]
Description=App via docker compose
After=docker.service
Requires=docker.service
[Service]
Type=oneshot
WorkingDirectory=/opt/app
RemainAfterExit=yes
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
[Install]
WantedBy=multi-user.target
EOT
fi
systemctl daemon-reload
systemctl enable app.service
systemctl start app.service
systemctl --no-pager status app.service
