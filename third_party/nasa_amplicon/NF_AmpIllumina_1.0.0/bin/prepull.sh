#!/usr/bin/env bash
set -euo pipefail

# Pre-pull workflow container images for offline execution.
# Images and digests are defined in ../images.lock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="$SCRIPT_DIR/../images.lock"

while IFS='=' read -r image digest; do
  image=$(echo "$image" | tr -d '" ')
  digest=$(echo "$digest" | tr -d '" ')
  [[ -z "$image" || -z "$digest" || "$image" =~ '^#' ]] && continue
  echo "Pulling $image@$digest"
  docker pull "$image@$digest"
done < <(grep -v '^#' "$LOCK_FILE" | sed -n 's/\(.*\)=\(.*\)/\1=\2/p')
