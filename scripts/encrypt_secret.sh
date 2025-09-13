#!/usr/bin/env bash
set -euo pipefail

KEY_FILE="secrets/age.key"
if [ ! -f "$KEY_FILE" ]; then
  mkdir -p "$(dirname "$KEY_FILE")"
  age-keygen -o "$KEY_FILE"
  echo "Generated age key at $KEY_FILE"
fi

RECIPIENT=$(grep -m1 'public key:' "$KEY_FILE" | awk '{print $4}')
if [ -z "$RECIPIENT" ]; then
  echo "Could not read age public key" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo ".env file not found" >&2
  exit 1
fi

sops --encrypt --age "$RECIPIENT" .env > .env.enc

echo "Encrypted .env to .env.enc"
