#!/usr/bin/env bash
set -e

if ! command -v nmcli >/dev/null 2>&1; then
  apt-get update && apt-get install -y network-manager
fi
if ! command -v mmcli >/dev/null 2>&1; then
  apt-get update && apt-get install -y modemmanager
fi

install -Dm755 usr/local/bin/verizon-check.sh /usr/local/bin/verizon-check.sh
install -Dm644 etc/systemd/system/verizon-check.service /etc/systemd/system/verizon-check.service
install -Dm644 etc/systemd/system/verizon-check.timer /etc/systemd/system/verizon-check.timer
install -Dm644 etc/default/verizon-check /etc/default/verizon-check

systemctl daemon-reload
systemctl enable --now verizon-check.timer
