#!/usr/bin/env bash
# Wrapper script to execute the organisation audit.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/org_audit.py" "$@"
