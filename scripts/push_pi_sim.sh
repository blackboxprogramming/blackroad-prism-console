#!/usr/bin/env bash
# Copy heartbeat tooling to pi-sim and install the service.
set -euo pipefail

HOST=${1:-pi-sim.local}
MQTT_HOST=${MQTT_HOST:-pi-ops.local}

scp pis/heartbeat.py scripts/install_pi_node.sh "pi@${HOST}:/home/pi/"
ssh "pi@${HOST}" "MQTT_HOST=${MQTT_HOST} NODE_NAME=pi-sim bash /home/pi/install_pi_node.sh"
