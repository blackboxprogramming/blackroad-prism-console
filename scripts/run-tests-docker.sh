#!/usr/bin/env bash
set -euo pipefail

# Run the repository tests inside an official node:20 Docker image.
# Usage: ./scripts/run-tests-docker.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

docker run --rm -it \
  -v "$ROOT_DIR":/work -w /work \
  -e CI=true \
  node:20-bullseye \
  bash -lc "npm ci && npm test"
