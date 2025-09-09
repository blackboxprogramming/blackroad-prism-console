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

