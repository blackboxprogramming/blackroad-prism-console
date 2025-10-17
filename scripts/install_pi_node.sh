#!/usr/bin/env bash
# Install the heartbeat publisher on a Raspberry Pi node.
set -euo pipefail

NODE_NAME=${1:-${NODE_NAME:-}}
if [[ -z "$NODE_NAME" ]]; then
  echo "Usage: NODE_NAME=<node> bash install_pi_node.sh" >&2
  exit 1
fi

USER_NAME=${PI_USER:-pi}
HOME_DIR=$(getent passwd "$USER_NAME" | cut -d: -f6)
STACK_DIR="${HOME_DIR}/pi-stack"
SCRIPT_SOURCE="${HOME_DIR}/heartbeat.py"
VENV_DIR="${STACK_DIR}/.venv"
MQTT_HOST=${MQTT_HOST:-pi-ops.local}
SERVICE_NAME="pi-heartbeat.service"

if [[ ! -f "$SCRIPT_SOURCE" ]]; then
  echo "heartbeat.py must be uploaded to ${HOME_DIR} before running this installer" >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip python3-psutil || true

mkdir -p "$STACK_DIR"
install -m 0755 "$SCRIPT_SOURCE" "${STACK_DIR}/heartbeat.py"

python3 -m venv "$VENV_DIR"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install paho-mqtt psutil

cat <<SERVICE | sudo tee /etc/systemd/system/${SERVICE_NAME} >/dev/null
[Unit]
Description=Pi Heartbeat Publisher (${NODE_NAME})
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER_NAME}
Group=${USER_NAME}
WorkingDirectory=${STACK_DIR}
Environment=PYTHONUNBUFFERED=1
Environment=NODE_NAME=${NODE_NAME}
Environment=MQTT_HOST=${MQTT_HOST}
ExecStart=${VENV_DIR}/bin/python ${STACK_DIR}/heartbeat.py --node ${NODE_NAME}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now ${SERVICE_NAME}

echo "Heartbeat publisher installed for ${NODE_NAME}."
