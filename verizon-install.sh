#!/usr/bin/env bash
set -euo pipefail

packages=()
if ! command -v mmcli >/dev/null 2>&1; then
  packages+=(modemmanager)
fi
if ! command -v nmcli >/dev/null 2>&1; then
  packages+=(network-manager)
fi
if [[ ${#packages[@]} -gt 0 ]]; then
  sudo apt-get update
  sudo apt-get install -y "${packages[@]}"
fi

sudo install -m 755 usr/local/bin/verizon-check.sh /usr/local/bin/verizon-check.sh
sudo install -m 644 etc/systemd/system/verizon-check.service /etc/systemd/system/verizon-check.service
sudo install -m 644 etc/systemd/system/verizon-check.timer /etc/systemd/system/verizon-check.timer
sudo install -m 644 etc/default/verizon-check /etc/default/verizon-check

sudo systemctl daemon-reload
sudo systemctl enable --now verizon-check.timer
