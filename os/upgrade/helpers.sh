#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/blackroad"
STACK_DIR="$ROOT/os/docker"
SMOKE="$ROOT/os/tests/smoke.sh"
CHANNEL_FILE="$ROOT/os/releases/channel"
LAST_GOOD_FILE="$ROOT/os/releases/last-good"

# Compose wrapper
dc() { (cd "$STACK_DIR" && docker compose "$@"); }

# Current & latest tags
current_tag() {
  git -C "$ROOT" describe --tags --abbrev=0 2>/dev/null || echo "none"
}

read_channel() {
  if [[ -f "$CHANNEL_FILE" ]]; then cat "$CHANNEL_FILE"; else echo "stable"; fi
}

# pick latest tag by channel: vX.Y.Z (stable) or include pre-releases (edge)
latest_tag_for_channel() {
  local channel="$1"
  local all
  all="$(git -C "$ROOT" tag --list "v*" | sort -V)"
  if [[ -z "$all" ]]; then echo ""; return 0; fi

  if [[ "$channel" == "edge" ]]; then
    # allow rc/beta tags, assume semver-ish sorting
    echo "$all" | tail -n1
  else
    # stable = no pre-release markers
    echo "$all" | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | tail -n1
  fi
}

save_last_good() {
  local tag="$1"
  echo "$tag" | sudo tee "$LAST_GOOD_FILE" >/dev/null
}

last_good() {
  if [[ -f "$LAST_GOOD_FILE" ]]; then cat "$LAST_GOOD_FILE"; else echo "none"; fi
}
