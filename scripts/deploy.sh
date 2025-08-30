#!/usr/bin/env sh
# Usage:
#   SERVER_HOST=... SERVER_USER=... SSH_KEY="(private key text)" ./scripts/deploy.sh release.tar.gz
# or:
#   SERVER_HOST=... SERVER_USER=... SSH_KEY_PATH=/path/to/key ./scripts/deploy.sh release.tar.gz
#
# Env (with defaults):
#   SSH_PORT=22
#   DEPLOY_ROOT=/opt/blackroad/releases
#   WEB_PATH=/var/www/blackroad
#   API_PATH=/srv/blackroad-api
#   HEALTH_URL=https://blackroad.io/health
#   API_HEALTH_URL=https://blackroad.io/api/health
#   RELEASE=$GITHUB_SHA or timestamp
#   KEEP_RELEASES=3
#   DO_API_DEPLOY=1 (set 0 to skip API)

set -eu

log(){ printf '%s %s\n' "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"; }
die(){ log "ERROR: $*"; exit 1; }

TARBALL_PATH="${1:-release.tar.gz}"
[ -f "$TARBALL_PATH" ] || die "Release tarball not found at $TARBALL_PATH"

: "${SERVER_HOST:?Set SERVER_HOST}"
: "${SERVER_USER:?Set SERVER_USER}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/blackroad/releases}"
WEB_PATH="${WEB_PATH:-/var/www/blackroad}"
API_PATH="${API_PATH:-/srv/blackroad-api}"
HEALTH_URL="${HEALTH_URL:-https://blackroad.io/health}"
API_HEALTH_URL="${API_HEALTH_URL:-https://blackroad.io/api/health}"
RELEASE="${RELEASE:-${GITHUB_SHA:-$(date +'%Y%m%d%H%M%S')}}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
DO_API_DEPLOY="${DO_API_DEPLOY:-1}"

# SSH key handling (either SSH_KEY_PATH or SSH_KEY)
if [ -n "${SSH_KEY_PATH:-}" ] && [ -f "${SSH_KEY_PATH}" ]; then
  KEYFILE="$SSH_KEY_PATH"
else
  : "${SSH_KEY:?Provide SSH_KEY or SSH_KEY_PATH}"
  KEYFILE="$(mktemp)"
  printf '%s\n' "$SSH_KEY" > "$KEYFILE"
  chmod 600 "$KEYFILE"
fi

# known_hosts hardening
mkdir -p "$HOME/.ssh"
if ! grep -q "$SERVER_HOST" "$HOME/.ssh/known_hosts" 2>/dev/null; then
  if command -v ssh-keyscan >/dev/null 2>&1; then
    ssh-keyscan -p "$SSH_PORT" -H "$SERVER_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
  fi
fi

log "Uploading release $RELEASE to $SERVER_HOST"
scp -P "$SSH_PORT" -i "$KEYFILE" "$TARBALL_PATH" "$SERVER_USER@$SERVER_HOST:/tmp/release-${RELEASE}.tar.gz"

REMOTE_DEPLOY=$(cat <<'EOS'
set -eu
log(){ printf '%s %s\n' "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"; }
ensure_dir(){ d="$1"; [ -d "$d" ] || mkdir -p "$d"; }

REL_DIR="${DEPLOY_ROOT}/${RELEASE}"
log "Creating release directory: ${REL_DIR}"
ensure_dir "$DEPLOY_ROOT"
ensure_dir "$REL_DIR"

log "Extracting tarball"
tar -xzf "/tmp/release-${RELEASE}.tar.gz" -C "$REL_DIR"

# Prepare web (first-run safety: preserve real dir)
if [ -d "${REL_DIR}/web" ]; then
  ensure_dir "$(dirname "$WEB_PATH")"
  if [ -e "$WEB_PATH" ] && [ ! -L "$WEB_PATH" ]; then
    mv "$WEB_PATH" "${WEB_PATH}.legacy.$(date +%s)" || true
  fi
fi

# Prepare API (first-run safety: preserve real dir)
if [ -d "${REL_DIR}/api" ] && [ "${DO_API_DEPLOY:-1}" = "1" ]; then
  if [ -e "$API_PATH" ] && [ ! -L "$API_PATH" ]; then
    mv "$API_PATH" "${API_PATH}.legacy.$(date +%s)" || true
  fi
  if [ -f "${REL_DIR}/api/package.json" ] && command -v npm >/dev/null 2>&1; then
    log "Installing API production deps"
    (cd "${REL_DIR}/api" && npm ci --omit=dev >/dev/null 2>&1 || npm ci --production >/dev/null 2>&1 || true)
    (cd "${REL_DIR}/api" && npm run build --if-present >/dev/null 2>&1 || true)
  fi
fi

# Capture previous targets (for rollback metadata)
PREV_WEB_TARGET=""
PREV_API_TARGET=""
[ -L "$WEB_PATH" ] && PREV_WEB_TARGET="$(readlink "$WEB_PATH" || true)"
[ -L "$API_PATH" ] && PREV_API_TARGET="$(readlink "$API_PATH" || true)"

# Atomic symlink switch
if [ -d "${REL_DIR}/web" ]; then
  ln -sfn "${REL_DIR}/web" "$WEB_PATH"
  log "WEB now -> $(readlink "$WEB_PATH" || echo '?')"
fi

if [ -d "${REL_DIR}/api" ] && [ "${DO_API_DEPLOY:-1}" = "1" ]; then
  ln -sfn "${REL_DIR}/api" "$API_PATH"
  log "API now -> $(readlink "$API_PATH" || echo '?')"
  if command -v systemctl >/dev/null 2>&1 && systemctl is-enabled --quiet blackroad-api 2>/dev/null; then
    log "Restarting blackroad-api"
    systemctl restart blackroad-api || true
  fi
fi

# Keep only last N releases
if [ -d "$DEPLOY_ROOT" ]; then
  COUNT="$(ls -1dt "$DEPLOY_ROOT"/* 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$COUNT" -gt "${KEEP_RELEASES:-3}" ]; then
    log "Pruning old releases (keep ${KEEP_RELEASES})"
    ls -1dt "$DEPLOY_ROOT"/* 2>/dev/null | awk "NR>${KEEP_RELEASES:-3}" | xargs -r rm -rf --
  fi
fi

# Save rollback metadata
ROLLBACK_META="${DEPLOY_ROOT}/.rollback-${RELEASE}.txt"
{
  echo "PREV_WEB_TARGET=${PREV_WEB_TARGET}"
  echo "PREV_API_TARGET=${PREV_API_TARGET}"
} > "$ROLLBACK_META"

log "Remote deploy completed"
EOS
)

ssh -p "$SSH_PORT" -i "$KEYFILE" "$SERVER_USER@$SERVER_HOST" \
  RELEASE="$RELEASE" DEPLOY_ROOT="$DEPLOY_ROOT" WEB_PATH="$WEB_PATH" API_PATH="$API_PATH" KEEP_RELEASES="$KEEP_RELEASES" DO_API_DEPLOY="$DO_API_DEPLOY" /bin/sh -s <<EOF
$REMOTE_DEPLOY
EOF

# External health checks (via domain)
fail=0
if [ -n "${HEALTH_URL:-}" ]; then
  if ! curl -fsS -m 20 "$HEALTH_URL" >/dev/null; then
    log "Health check FAILED: $HEALTH_URL"; fail=1
  else
    log "Health OK: $HEALTH_URL"
  fi
fi
if [ -n "${API_HEALTH_URL:-}" ]; then
  if ! curl -fsS -m 20 "$API_HEALTH_URL" >/dev/null; then
    log "API health FAILED: $API_HEALTH_URL"; fail=1
  else
    log "API OK: $API_HEALTH_URL"
  fi
fi

if [ "$fail" -ne 0 ]; then
  log "Rolling back (health failure)"
  ROLLBACK_REMOTE=$(cat <<'EOS'
set -eu
log(){ printf '%s %s\n' "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"; }
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/blackroad/releases}"
WEB_PATH="${WEB_PATH:-/var/www/blackroad}"
API_PATH="${API_PATH:-/srv/blackroad-api}"

PREV="$(ls -1dt "$DEPLOY_ROOT"/* 2>/dev/null | sed -n '2p' || true)"
if [ -n "$PREV" ] && [ -d "$PREV" ]; then
  if [ -d "$PREV/web" ] && [ -e "$WEB_PATH" ]; then
    ln -sfn "$PREV/web" "$WEB_PATH"
    log "Rolled back WEB -> $PREV/web"
  fi
  if [ -d "$PREV/api" ] && [ -e "$API_PATH" ]; then
    ln -sfn "$PREV/api" "$API_PATH"
    log "Rolled back API -> $PREV/api"
    if command -v systemctl >/dev/null 2>&1; then
      systemctl restart blackroad-api || true
    fi
  fi
else
  log "No previous release to roll back to."
fi
EOS
)
  ssh -p "$SSH_PORT" -i "$KEYFILE" "$SERVER_USER@$SERVER_HOST" \
    DEPLOY_ROOT="$DEPLOY_ROOT" WEB_PATH="$WEB_PATH" API_PATH="$API_PATH" /bin/sh -s <<EOF
$ROLLBACK_REMOTE
EOF
  die "Deployment failed and was rolled back."
fi

log "Deployment succeeded (release ${RELEASE})"

# Cleanup temp key created by this script
if [ -n "${SSH_KEY:-}" ] && [ -f "$KEYFILE" ] && [ ! -n "${SSH_KEY_PATH:-}" ]; then
  rm -f "$KEYFILE"
fi
