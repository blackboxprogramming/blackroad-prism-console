#!/usr/bin/env bash
# Bootstrap Mosquitto, Samba, and the heartbeat logger on pi-ops.
set -euo pipefail

USER_NAME=${PI_USER:-pi}
HOME_DIR=$(getent passwd "$USER_NAME" | cut -d: -f6)
INSTALL_DIR="${HOME_DIR}/pi-ops"
VENV_DIR="${INSTALL_DIR}/.venv"
SERVICE_NAME="pi-ops-heartbeat-logger.service"
LOG_SOURCE="${HOME_DIR}/hb_log.py"

if [[ ! -f "$LOG_SOURCE" ]]; then
  SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  if [[ -f "${SCRIPT_DIR}/hb_log.py" ]]; then
    LOG_SOURCE="${SCRIPT_DIR}/hb_log.py"
  else
    echo "hb_log.py not found next to installer or in home directory" >&2
    exit 1
  fi
fi

sudo apt-get update
sudo apt-get install -y mosquitto mosquitto-clients samba python3-venv python3-pip

sudo systemctl enable --now mosquitto

sudo mkdir -p "$INSTALL_DIR"
sudo chown -R "$USER_NAME":"$USER_NAME" "$INSTALL_DIR"

python3 -m venv "$VENV_DIR"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install paho-mqtt

install -m 0755 "$LOG_SOURCE" "${INSTALL_DIR}/hb_log.py"

LOG_DIR="${INSTALL_DIR}/logs"
mkdir -p "$LOG_DIR"

cat <<SERVICE | sudo tee /etc/systemd/system/${SERVICE_NAME} >/dev/null
[Unit]
Description=Pi-Ops Heartbeat Logger
After=network-online.target mosquitto.service
Wants=network-online.target
Requires=mosquitto.service

[Service]
Type=simple
User=${USER_NAME}
Group=${USER_NAME}
WorkingDirectory=${INSTALL_DIR}
Environment=PYTHONUNBUFFERED=1
Environment=HB_LOG_DIR=${INSTALL_DIR}/logs
ExecStart=${VENV_DIR}/bin/python ${INSTALL_DIR}/hb_log.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now ${SERVICE_NAME}

echo "Heartbeat logger installed and running." 

SHARE_DIR="${HOME_DIR}/share"
mkdir -p "$SHARE_DIR"
chmod 0775 "$SHARE_DIR"

if ! grep -q "\[piops\]" /etc/samba/smb.conf; then
  cat <<CONF | sudo tee -a /etc/samba/smb.conf >/dev/null
[piops]
   path = ${SHARE_DIR}
   browseable = yes
   read only = no
   guest ok = yes
   create mask = 0664
   directory mask = 0775
CONF
fi

sudo systemctl enable --now smbd nmbd

echo "Samba share available at //$(hostname)/piops"
