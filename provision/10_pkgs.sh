#!/bin/bash
set -euo pipefail

# Prepare offline package repos
apt-get update
apt-get install -y apt-mirror rsync
mkdir -p /var/www/mirror
apt-mirror /etc/apt/mirror.list || true
