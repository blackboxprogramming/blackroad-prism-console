#!/bin/bash
set -euo pipefail
sudo ufw default deny outgoing
sudo ufw allow out to 10.0.0.0/8
sudo ufw allow out to 127.0.0.1
