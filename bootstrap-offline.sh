#!/usr/bin/env bash
set -euo pipefail

# Preload required container images into local registry
IMAGES=(
  "traefik:v2.10"
  "ollama/ollama:0.1.26"
  "qdrant/qdrant:v1.10.0"
  "postgres:16-alpine"
  "getmeili/meilisearch:v1.7.3"
  "quay.io/minio/minio:RELEASE.2024-01-18T22-31-29Z"
  "quay.io/keycloak/keycloak:24.0.3"
  "nats:2.10-alpine"
  "hashicorp/vault:1.15.3"
  "prom/prometheus:v2.49.1"
  "grafana/grafana:10.3.1"
  "grafana/loki:2.9.5"
  "sonatype/nexus3:3.68.0"
  "gitea/gitea:1.21.4"
)

for image in "${IMAGES[@]}"; do
  echo "Pulling $image"
  docker pull "$image"
  docker save "$image" | gzip > "$(echo $image | tr '/:' '_').tar.gz"
  docker load < "$(echo $image | tr '/:' '_').tar.gz"
  rm "$(echo $image | tr '/:' '_').tar.gz"
  docker tag "$image" registry.blackroad.local/$image
  docker push registry.blackroad.local/$image || true
done

# Preload Ollama models
mkdir -p data/models
if [ ! -f data/models/phi.bin ]; then
  echo "Expect phi model tarball in data/models/phi.bin"
fi
