#!/usr/bin/env bash
# Fix/upgrade (re)configure self-hosted GitHub Actions runners over SSH.
# - Gets a fresh registration token per host (org/repo scope)
# - Downloads correct runner arch (x64/arm64/arm), installs/updates, installs service, starts it
# - Idempotent: uses --replace when already configured
# Requirements (controller): bash, ssh, scp, curl, jq
# Requirements (remote): bash, curl, tar, sudo (installdependencies.sh will apt/yum/dnf what's needed)

set -euo pipefail

# -------- Controller config --------
: "${GITHUB_TOKEN:?export GITHUB_TOKEN with scopes (repo admin or admin:org)}"
SCOPE="${SCOPE:-repo}"                 # repo | org
OWNER="${OWNER:-blackboxprogramming}"  # org or repo owner
REPO="${REPO:-blackroad-prism-console}"# repo name if SCOPE=repo
LABELS="${LABELS:-blackroad,linux}"    # comma-separated labels
RUNNER_BASE="${RUNNER_BASE:-/srv/actions-runner}"
RUNNER_NAME_PREFIX="${RUNNER_NAME_PREFIX:-br-runner}"
PARALLEL="${PARALLEL:-8}"              # concurrent SSH sessions
SSH_USER="${SSH_USER:-root}"
SSH_OPTS="${SSH_OPTS:--o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8}"
HOSTS_FILE="${HOSTS_FILE:-/etc/fix-runners/hosts.txt}"  # one host per line; supports user@host

# Optional: pin version; otherwise auto-detect latest
RUNNER_VERSION="${RUNNER_VERSION:-}"

# -------- Helper: log --------
say(){ printf "[%s] %s\n" "$(date +%H:%M:%S)" "$*"; }

# -------- Get latest runner version (e.g., 2.317.0) --------
detect_version() {
  if [[ -n "$RUNNER_VERSION" ]]; then echo "$RUNNER_VERSION"; return; fi
  curl -fsSL https://api.github.com/repos/actions/runner/releases/latest \
    | jq -r '.tag_name' | sed 's/^v//' | awk 'NF' || {
      say "WARN: could not detect latest version; set RUNNER_VERSION env"
      exit 1
    }
}

# -------- Get a registration token (short-lived) --------
get_reg_token() {
  if [[ "$SCOPE" == "org" ]]; then
    curl -fsSL -X POST \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/orgs/${OWNER}/actions/runners/registration-token" \
      | jq -r '.token'
  else
    curl -fsSL -X POST \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${OWNER}/${REPO}/actions/runners/registration-token" \
      | jq -r '.token'
  fi
}

# -------- Compose GitHub URL for config.sh --------
runner_url() {
  if [[ "$SCOPE" == "org" ]]; then
    echo "https://github.com/${OWNER}"
  else
    echo "https://github.com/${OWNER}/${REPO}"
  fi
}

# -------- Remote fixer script (uploaded then invoked over SSH) --------
read -r -d '' REMOTE_SCRIPT <<'EOS'
#!/usr/bin/env bash
set -euo pipefail

# Inputs via env:
#   RUNNER_URL, REG_TOKEN, RUNNER_VERSION, RUNNER_DIR, RUNNER_NAME, LABELS
RUNNER_URL="${RUNNER_URL:?}"
REG_TOKEN="${REG_TOKEN:?}"
RUNNER_VERSION="${RUNNER_VERSION:?}"
RUNNER_DIR="${RUNNER_DIR:-/srv/actions-runner}"
RUNNER_NAME="${RUNNER_NAME:-runner-$(hostname)}"
LABELS="${LABELS:-linux}"

arch_map() {
  case "$(uname -m)" in
    x86_64) echo "x64" ;;
    aarch64) echo "arm64" ;;
    armv7l|armv6l|armhf) echo "arm" ;;
    *) echo "x64" ;;
  esac
}
ARCH="$(arch_map)"
TAR="actions-runner-linux-${ARCH}-${RUNNER_VERSION}.tar.gz"
URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TAR}"

sudo mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

# Stop current service if present (ignore errors)
if [ -f ./svc.sh ]; then
  sudo ./svc.sh stop || true
fi

# Download & extract runner if not present or version drift
NEED_DL=1
if [ -x ./bin/Runner.Listener ]; then
  CURV="$(./bin/Runner.Listener --version || true)"
  if [ "$CURV" = "$RUNNER_VERSION" ]; then NEED_DL=0; fi
fi
if [ "$NEED_DL" -eq 1 ]; then
  sudo rm -rf ./* || true
  curl -fsSL -o "${TAR}" "${URL}"
  sudo tar xzf "${TAR}"
  sudo rm -f "${TAR}"
fi

# Ensure dependencies
if [ -x ./bin/installdependencies.sh ]; then
  sudo ./bin/installdependencies.sh || true
fi

# Configure (idempotent) --replace runner with same name
sudo ./config.sh --unattended \
  --url "${RUNNER_URL}" \
  --token "${REG_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "${LABELS}" \
  --work "_work" \
  --replace

# Install + start systemd service
sudo ./svc.sh install || true
sudo ./svc.sh start

# Emit status
sleep 1
if command -v systemctl >/dev/null 2>&1; then
  systemctl is-active --quiet "$(basename "$(pwd)")" 2>/dev/null || true
fi
./run.sh --version || true
echo "::runner_ready::ok"
EOS

# -------- Validate inputs --------
[[ -r "$HOSTS_FILE" ]] || { say "No hosts file: $HOSTS_FILE"; exit 2; }

RUNNER_VERSION="$(detect_version)"
GH_URL="$(runner_url)"
say "Using runner v${RUNNER_VERSION}  scope=${SCOPE}  url=${GH_URL}"
say "Hosts file: ${HOSTS_FILE}  parallel=${PARALLEL}"

# Prepare temp remote script
TMP_REMOTE="/tmp/runner_fix_remote.sh"
echo "$REMOTE_SCRIPT" > /tmp/runner_fix_remote.sh

# Results summary
OK_HOSTS=()
BAD_HOSTS=()

fix_one() {
  local target="$1"
  local host user
  if [[ "$target" == *@* ]]; then
    user="${target%@*}"; host="${target#*@}"
  else
    user="${SSH_USER}"; host="$target"
  fi
  local rname="${RUNNER_NAME_PREFIX}-${host}"

  # Fresh token per host
  local token
  if ! token="$(get_reg_token)"; then
    say "ERR token for $host"; echo "$host" >> /tmp/fixrunners.bad; return
  fi

  # Copy remote script
  scp $SSH_OPTS /tmp/runner_fix_remote.sh "${user}@${host}:/tmp/runner_fix_remote.sh" >/dev/null 2>&1 || {
    say "ERR scp -> $host"; echo "$host" >> /tmp/fixrunners.bad; return
  }

  # Run remote script with env
  if ssh $SSH_OPTS "${user}@${host}" \
    "sudo env RUNNER_URL='$GH_URL' REG_TOKEN='$token' RUNNER_VERSION='$RUNNER_VERSION' RUNNER_DIR='$RUNNER_BASE' RUNNER_NAME='$rname' LABELS='$LABELS' bash /tmp/runner_fix_remote.sh" \
    | grep -q "::runner_ready::ok"; then
      say "OK  $host"
      echo "$host" >> /tmp/fixrunners.ok
  else
      say "BAD $host"
      echo "$host" >> /tmp/fixrunners.bad
  fi
}

export -f fix_one get_reg_token runner_url say
export GITHUB_TOKEN SCOPE OWNER REPO GH_URL RUNNER_VERSION RUNNER_BASE RUNNER_NAME_PREFIX LABELS SSH_OPTS SSH_USER

# Clean previous temp summaries
: > /tmp/fixrunners.ok
: > /tmp/fixrunners.bad

# Kick off in parallel
if command -v xargs >/dev/null 2>&1; then
  cat "$HOSTS_FILE" | grep -v '^[[:space:]]*$' | grep -v '^[[:space:]]*#' | xargs -I{} -P "$PARALLEL" bash -lc 'fix_one "$@"' _ {}
else
  # Fallback: sequential
  while IFS= read -r h; do
    [[ "$h" =~ ^[[:space:]]*$ || "$h" =~ ^[[:space:]]*# ]] && continue
    fix_one "$h"
  done < "$HOSTS_FILE"
fi

say "==== SUMMARY ===="
okc=$(wc -l < /tmp/fixrunners.ok | tr -d ' ')
badc=$(wc -l < /tmp/fixrunners.bad | tr -d ' ')
say "OK:  $okc"
say "BAD: $badc"
[[ "$badc" -eq 0 ]] || { say "List of failures:"; cat /tmp/fixrunners.bad; exit 1; }

