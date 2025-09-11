#!/bin/bash
# Simple Vault bootstrap used in CI tests.
# Installs Docker and writes a minimal file-backed configuration.
set -euo pipefail

# Ensure Docker is available for the Vault container
apt-get install -y docker.io
mkdir -p /srv/vault
cat <<CFG > /srv/vault/config.hcl
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}
storage "file" {
  path = "/srv/vault/data"
}
ui = true
CFG
