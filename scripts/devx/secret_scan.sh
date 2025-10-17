#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for secret scanning" >&2
  exit 0
fi

docker run --rm \
  -v "${PWD}:/repo" \
  --workdir /repo \
  zricethezav/gitleaks:latest detect \
  --no-banner \
  --redact \
  --source=/repo
