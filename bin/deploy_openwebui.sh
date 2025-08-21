#!/usr/bin/env bash
# BIN: deploy_openwebui.sh
# Purpose: Deploy Open WebUI behind NGINX with Ollama/OpenAI backends.

set -euo pipefail

# ──[ Edit these if needed ]──────────────────────────────────────────────────────
DOMAIN="${DOMAIN:-openwebui.blackroad.io}"
# If your Ollama runs elsewhere, point to it:
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
OPENAI_API_BASE_URL="${OPENAI_API_BASE_URL:-https://api.openai.com/v1}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"          # optional; can be set later in UI

# OIDC / SSO (optional). Leave blank to keep local login.
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-}"
OIDC_CLIENT_SECRET="${OIDC_CLIENT_SECRET:-}"
OIDC_ISSUER="${OIDC_ISSUER:-}"                # e.g., https://auth.example.com/realms/main
OAUTH_ALLOWED_DOMAINS="${OAUTH_ALLOWED_DOMAINS:-blackroad.io}"
ENABLE_OAUTH_ROLE_MANAGEMENT="${ENABLE_OAUTH_ROLE_MANAGEMENT:-true}"
ENABLE_LOGIN_FORM="${ENABLE_LOGIN_FORM:-false}"  # hide local form when using SSO

# Host port for the app (container listens on 8080)
HOST_PORT="${HOST_PORT:-3000}"

# ──[ Paths ]────────────────────────────────────────────────────────────────────
APP_DIR="/opt/open-webui"
DC_DIR="$APP_DIR/docker"
DC_FILE="$DC_DIR/open-webui.yml"
ENV_FILE="$DC_DIR/open-webui.env"
NGINX_AVAIL="/etc/nginx/sites-available/openwebui.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/openwebui.conf"

# ──[ Pre-flight ]───────────────────────────────────────────────────────────────
mkdir -p "$DC_DIR"
command -v docker >/dev/null || { echo "Docker is required."; exit 1; }
docker network inspect lucidia-network >/dev/null 2>&1 || docker network create lucidia-network

# ──[ Env file for compose variable substitution & container env ]───────────────
cat > "$ENV_FILE" <<EOF
# FILE: $ENV_FILE
DOMAIN=${DOMAIN}
HOST_PORT=${HOST_PORT}
OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
OPENAI_API_BASE_URL=${OPENAI_API_BASE_URL}
OPENAI_API_KEY=${OPENAI_API_KEY}

# SSO (optional)
ENABLE_LOGIN_FORM=${ENABLE_LOGIN_FORM}
OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
OIDC_CLIENT_SECRET=${OIDC_CLIENT_SECRET}
OIDC_ISSUER=${OIDC_ISSUER}
OAUTH_ALLOWED_DOMAINS=${OAUTH_ALLOWED_DOMAINS}
ENABLE_OAUTH_ROLE_MANAGEMENT=${ENABLE_OAUTH_ROLE_MANAGEMENT}
EOF

# ──[ Docker Compose (Open WebUI service; assumes Ollama exists on the network) ]─
cat > "$DC_FILE" <<'YAML'
# FILE: /opt/open-webui/docker/open-webui.yml
version: "3.8"

services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: unless-stopped
    ports:
      - "${HOST_PORT}:8080"
    environment:
      WEBUI_URL: "https://${DOMAIN}"
      OLLAMA_BASE_URL: "${OLLAMA_BASE_URL}"
      OPENAI_API_BASE_URL: "${OPENAI_API_BASE_URL}"
      OPENAI_API_KEY: "${OPENAI_API_KEY}"
      ENABLE_LOGIN_FORM: "${ENABLE_LOGIN_FORM}"
      OAUTH_CLIENT_ID: "${OIDC_CLIENT_ID}"
      OAUTH_CLIENT_SECRET: "${OIDC_CLIENT_SECRET}"
      OPENID_PROVIDER_URL: "${OIDC_ISSUER}"
      OPENID_REDIRECT_URI: "https://${DOMAIN}/oauth/oidc/callback"
      OAUTH_ALLOWED_DOMAINS: "${OAUTH_ALLOWED_DOMAINS}"
      ENABLE_OAUTH_ROLE_MANAGEMENT: "${ENABLE_OAUTH_ROLE_MANAGEMENT}"
    volumes:
      - open-webui-data:/app/backend/data
    networks:
      - lucidia-network
    # If you prefer to run Ollama as a sibling service here, uncomment below and add depends_on.
    # depends_on:
    #   - ollama

  # ollama:
  #   image: ollama/ollama:latest
  #   container_name: ollama
  #   restart: unless-stopped
  #   ports:
  #     - "11434:11434"
  #   volumes:
  #     - ollama-data:/root/.ollama
  #   networks:
  #     - lucidia-network

volumes:
  open-webui-data:
  # ollama-data:

networks:
  lucidia-network:
    external: true
YAML

# ──[ NGINX site (HTTP + optional HTTPS if Let's Encrypt certs present) ]────────
# Always provide HTTP (for initial cert bootstrap or temporary use)
cat > "$NGINX_AVAIL" <<EOF
# FILE: $NGINX_AVAIL
server {
  listen 80;
  server_name ${DOMAIN};
  # Redirect to HTTPS if certs exist; otherwise proxy directly over HTTP
  if (-d /etc/letsencrypt/live/${DOMAIN}) {
    return 301 https://\$host\$request_uri;
  }
  location / {
    proxy_pass http://127.0.0.1:${HOST_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    client_max_body_size 20M;
    proxy_read_timeout 10m;
  }
}
EOF

# If TLS certs already exist, append the HTTPS server block
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  cat >> "$NGINX_AVAIL" <<EOF

server {
  listen 443 ssl http2;
  server_name ${DOMAIN};

  ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:${HOST_PORT};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    client_max_body_size 20M;
    proxy_read_timeout 10m;
  }
}
EOF
fi

ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t && systemctl reload nginx || true

# ──[ Launch / Update ]──────────────────────────────────────────────────────────
docker compose --env-file "$ENV_FILE" -f "$DC_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$DC_FILE" up -d

echo
echo "✔ Open WebUI is up on http://${DOMAIN} (and https://${DOMAIN} if certs exist)."
echo "  - App container port -> ${HOST_PORT} (proxied by NGINX)"
echo "  - Data dir: volume 'open-webui-data'"
echo "  - To set/change secrets: edit ${ENV_FILE} and rerun the two 'docker compose' lines above."
echo
echo "If you need TLS: sudo certbot --nginx -d ${DOMAIN} (then this script already handles 443)."
