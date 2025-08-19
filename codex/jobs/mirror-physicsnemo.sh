#!/usr/bin/env bash
# Mirrorize & Harden: NVIDIA/physicsnemo
#
# This helper wraps repo-ops/mirrorize.sh to create a private mirror of
# https://github.com/NVIDIA/physicsnemo under the configured GitHub org.
#
# Usage:
#   ORG=<github-org> MIRROR_NAME=physicsnemo-mirror ./codex/jobs/mirror-physicsnemo.sh
#
# The script produces a full-history mirror and applies BlackRoad hardening
# (dependency pinning, SBOM generation, CI workflows, etc.) as implemented in
# repo-ops/mirrorize.sh.

set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-https://github.com/NVIDIA/physicsnemo}"
TARGET_ORG="${ORG:-blackroad}"          # override with ORG env
MIRROR_NAME="${MIRROR_NAME:-physicsnemo-mirror}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

# repo-ops/mirrorize.sh names mirrors by prefixing the upstream repo name.
# To force a specific mirror name, we run it with an empty prefix and then
# rename the resulting repository if needed.

export TARGET_ORG MIRROR_PREFIX="" REPOS="$UPSTREAM_REPO"
"$(dirname "$0")/../../repo-ops/mirrorize.sh"

# If the GitHub CLI is available and a custom mirror name was requested,
# rename the repo accordingly.
if command -v gh >/dev/null 2>&1 && [ "$MIRROR_NAME" != "physicsnemo" ]; then
  gh repo rename "${TARGET_ORG}/physicsnemo" "$MIRROR_NAME" || true
fi

# Set default branch if gh CLI is present.
if command -v gh >/dev/null 2>&1; then
  gh api -X PATCH "repos/${TARGET_ORG}/${MIRROR_NAME}" -f default_branch="$DEFAULT_BRANCH" >/dev/null || true
fi
