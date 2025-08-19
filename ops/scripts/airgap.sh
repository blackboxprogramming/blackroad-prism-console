#!/bin/bash
set -euo pipefail
OUT=${1:-../airgap}
mkdir -p "$OUT"
ART=(*.whl *.tgz *.tar)
tar czf "$OUT/bundle.tgz" "${ART[@]}"
if command -v syft >/dev/null 2>&1; then
  syft -o spdx-json infrastructure/docker-compose.yml > "$OUT/sbom.json"
fi
if command -v cosign >/dev/null 2>&1; then
  cosign sign-blob "$OUT/bundle.tgz" >/dev/null
fi
