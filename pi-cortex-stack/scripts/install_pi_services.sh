#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
SERVICE_DIR="$STACK_DIR/pi/services"
TARGET_DIR="/etc/systemd/system"

sudo cp "$SERVICE_DIR"/*.service "$TARGET_DIR"/
sudo systemctl daemon-reload

for service in "$SERVICE_DIR"/*.service; do
  svc_name="$(basename "$service")"
  sudo systemctl enable --now "$svc_name"
  echo "Installed and started $svc_name"
done
