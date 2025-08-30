#!/bin/sh
set -eu

: "${SERVER_HOST:?SERVER_HOST required}"
: "${SERVER_USER:?SERVER_USER required}"
: "${SSH_KEY:?SSH_KEY required}"
WEB_PATH="${WEB_PATH:-/var/www/blackroad}"
API_PATH="${API_PATH:-/srv/blackroad-api}"

key_file=$(mktemp)
trap 'rm -f "$key_file"' EXIT
printf '%s\n' "$SSH_KEY" >"$key_file"
chmod 600 "$key_file"

SSH="ssh -i $key_file -o StrictHostKeyChecking=no"
RSYNC="rsync -az --delete -e \"$SSH\""
release="$(date +%Y%m%d%H%M%S)"

$SSH "$SERVER_USER@$SERVER_HOST" "mkdir -p '$WEB_PATH/releases' '$API_PATH/releases'"

$RSYNC dist/web/ "$SERVER_USER@$SERVER_HOST:$WEB_PATH/releases/$release/"
$RSYNC dist/api/ "$SERVER_USER@$SERVER_HOST:$API_PATH/releases/$release/"

$SSH "$SERVER_USER@$SERVER_HOST" "WEB_PATH='$WEB_PATH' API_PATH='$API_PATH' RELEASE='$release' /bin/sh -s" <<'EOS'
set -eu

old_web=$(readlink -f "$WEB_PATH/current" 2>/dev/null || true)
old_api=$(readlink -f "$API_PATH/current" 2>/dev/null || true)

rollback() {
  [ -n "$old_web" ] && ln -sfn "$old_web" "$WEB_PATH/current"
  [ -n "$old_api" ] && ln -sfn "$old_api" "$API_PATH/current"
  rm -rf "$WEB_PATH/releases/$RELEASE" "$API_PATH/releases/$RELEASE"
  systemctl restart blackroad-api || true
}
trap rollback INT TERM HUP ERR

ln -sfn "$WEB_PATH/releases/$RELEASE" "$WEB_PATH/current"
ln -sfn "$API_PATH/releases/$RELEASE" "$API_PATH/current"

systemctl restart blackroad-api
curl -fsS http://localhost/health >/dev/null
EOS
