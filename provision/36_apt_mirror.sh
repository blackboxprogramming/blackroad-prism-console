#!/bin/bash
set -euo pipefail

apt-get install -y apt-mirror
sed -i 's/^deb /deb-src /' /etc/apt/mirror.list
apt-mirror || true
cat <<CFG > /etc/apt/sources.list.d/local-mirror.list
deb [trusted=yes] http://localhost/ubuntu/ focal main restricted universe multiverse
CFG
