#!/usr/bin/env bash
# Copy heartbeat tooling to pi-holo and install the service.
set -euo pipefail

HOST=${1:-pi-holo.local}
MQTT_HOST=${MQTT_HOST:-pi-ops.local}

scp pis/heartbeat.py scripts/install_pi_node.sh "pi@${HOST}:/home/pi/"
ssh "pi@${HOST}" "MQTT_HOST=${MQTT_HOST} NODE_NAME=pi-holo bash /home/pi/install_pi_node.sh"
