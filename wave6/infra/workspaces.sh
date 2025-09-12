#!/usr/bin/env bash
set -euo pipefail
workspace=${1:-staging}
terraform workspace select "$workspace" 2>/dev/null || terraform workspace new "$workspace"
