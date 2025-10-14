#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
VENV_DIR="${VENV_DIR:-$HOME/agent-venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
REQUIREMENTS_FILE="$STACK_DIR/requirements.txt"
APT_PACKAGES=(
  "python3-venv"
  "python3-pip"
  "libatlas-base-dev"
  "libjpeg-dev"
  "zlib1g-dev"
  "alsa-utils"
)
STATE_ROOT="/var/lib/pi-cortex"
LOG_ROOT="/var/log/pi-cortex"
OWNER="${SUDO_USER:-$USER}"
GROUP="$(id -gn "$OWNER")"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "error: $PYTHON_BIN is not available. Install Python 3 before continuing." >&2
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  echo "Installing required apt packages (${APT_PACKAGES[*]})"
  sudo apt-get update
  sudo apt-get install -y "${APT_PACKAGES[@]}"
else
  echo "Skipping apt dependencies; apt-get not available"
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
else
  echo "Using existing virtual environment at $VENV_DIR"
fi

# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

pip install --upgrade pip wheel
if [ -f "$REQUIREMENTS_FILE" ]; then
  pip install -r "$REQUIREMENTS_FILE"
else
  echo "warning: requirements file not found at $REQUIREMENTS_FILE" >&2
fi

deactivate

if [ ! -f "$STACK_DIR/.env" ] && [ -f "$STACK_DIR/.env.example" ]; then
  cp "$STACK_DIR/.env.example" "$STACK_DIR/.env"
  echo "Created default .env file at $STACK_DIR/.env"
fi

echo "Preparing state directories under $STATE_ROOT and log directories under $LOG_ROOT"
sudo install -d -m 775 -o "$OWNER" -g "$GROUP" \
  "$STATE_ROOT" \
  "$STATE_ROOT/holo" \
  "$STATE_ROOT/panel" \
  "$STATE_ROOT/audio" \
  "$STATE_ROOT/shared"
sudo install -d -m 775 -o "$OWNER" -g "$GROUP" "$LOG_ROOT"

echo "Installing systemd services"
"$STACK_DIR/scripts/install_pi_services.sh"

echo "Restarting Pi Cortex services"
for service in pi-holo-renderer.service pi-sim-panel.service pi-ops-heartbeat.service; do
  if systemctl list-units --type=service --all | grep -q "$service"; then
    sudo systemctl restart "$service" || true
  fi
done
