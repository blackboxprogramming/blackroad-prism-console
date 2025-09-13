#!/usr/bin/env bash
set -euo pipefail
find artifacts -type f -print0 | sort -z | xargs -0 sha256sum > artifacts.sha256
mkdir -p public
cp artifacts.sha256 public/artifacts.sha256 || true
echo "Artifacts hash -> public/artifacts.sha256"
