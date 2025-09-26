#!/usr/bin/env sh
set -eu
: "${DEPLOY_ROOT:=/opt/blackroad/releases}"
: "${WEB_PATH:=/var/www/blackroad}"
: "${API_PATH:=/srv/blackroad-api}"

sudo mkdir -p "$DEPLOY_ROOT" "$(dirname "$WEB_PATH")" "$(dirname "$API_PATH")"
sudo chown -R "$USER":"$USER" "$DEPLOY_ROOT" "$(dirname "$WEB_PATH")" "$(dirname "$API_PATH")"

echo "Bootstrap complete:
- DEPLOY_ROOT: $DEPLOY_ROOT
- WEB_PATH:    $WEB_PATH
- API_PATH:    $API_PATH

If /srv/blackroad-api is currently a real dir, your first deploy will preserve it as *.legacy.<ts> and switch to a symlink."

