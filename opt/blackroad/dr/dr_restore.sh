#!/usr/bin/env bash
# /opt/blackroad/dr/dr_restore.sh
set -euo pipefail
DATE=${1:?YYYY-MM-DD}

echo "Restoring DNS"
docker compose -f /opt/blackroad/edge/docker-compose.yml up -d bind

echo "Restoring Vault"
docker compose -f /opt/blackroad/iam/docker-compose.yml up -d vault
/opt/blackroad/iam/vault_bootstrap.sh

echo "Restoring Postgres"
docker compose -f /opt/blackroad/data/docker-compose.yml up -d postgres
/opt/blackroad/data/pitr.sh "$DATE"

echo "Restoring MinIO"
docker compose -f /opt/blackroad/data/docker-compose.yml up -d minio

echo "Restoring Gitea"
docker compose -f /opt/blackroad/dev/docker-compose.yml up -d gitea

echo "Restoring registry"
docker compose -f /opt/blackroad/dev/docker-compose.yml up -d registry
