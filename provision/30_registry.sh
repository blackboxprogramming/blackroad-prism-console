#!/bin/bash
set -euo pipefail

apt-get install -y docker.io
mkdir -p /srv/registry
cat <<CFG > /etc/docker/registry/config.yml
version: 0.1
storage:
  filesystem:
    rootdirectory: /srv/registry
http:
  addr: :5000
CFG
systemctl enable --now docker
