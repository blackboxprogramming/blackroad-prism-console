#!/usr/bin/env bash
# /opt/blackroad/models/load_models.sh
set -euo pipefail
models=/models/models.json
jq -c '.[]' "$models" | while read -r m; do
  name=$(echo "$m" | jq -r .name)
  path=$(echo "$m" | jq -r .path)
  sha=$(echo "$m" | jq -r .sha256)
  file=/models/${name}.gguf
  mc cp "$path" "$file"
  echo "$sha  $file" | sha256sum -c -
  ollama create "$name" -f "$file"
done
