#!/usr/bin/env bash
set -euo pipefail
ws=${1:?workspace required}
terraform workspace select "$ws" 2>/dev/null || terraform workspace new "$ws"
