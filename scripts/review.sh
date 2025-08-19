#!/usr/bin/env bash
# Wrapper around the Lucidia Peer-Review Agent.
# This script enables running the review pipeline in CI or locally
# without relying on any external services.
set -euo pipefail

dir=$(dirname "$0")/..
cd "$dir"

python tools/lucidia-review/lucidia_review/cli.py "$@"
