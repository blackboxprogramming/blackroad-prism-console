#!/bin/bash
set -euo pipefail
MANIFEST=${1:-seed-manifest.yaml}
PYPI_URL=${PYPI_URL:-http://localhost:3141/root/pypi/}
NPM_REG=${NPM_REG:-http://localhost:4873}
DOCKER_REG=${DOCKER_REG:-localhost:5000}
MODEL_DIR=${MODEL_DIR:-/var/lib/ollama/models}

# Seed python packages
while IFS= read -r pkg; do
  [ -z "$pkg" ] && continue
  pip download --no-deps --index-url "$PYPI_URL" "$pkg"
done < <(yq '.python[]' "$MANIFEST")

# Seed npm packages
for name in $(yq '.npm[].name' "$MANIFEST"); do
  ver=$(yq ".npm[] | select(.name==\"$name\") | .version" "$MANIFEST")
  npm --registry "$NPM_REG" pack "$name@$ver"
done

# Seed docker images
for img in $(yq '.docker[]' "$MANIFEST"); do
  docker pull "$DOCKER_REG/$img" && docker save "$DOCKER_REG/$img" -o "${img//[:\/]/_}.tar"
done

# Seed models
mkdir -p "$MODEL_DIR"
for model in $(yq '.models[]' "$MANIFEST"); do
  ollama pull "$model"
  ollama export "$model" "$MODEL_DIR/$model.ollama"
done
