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
# Encrypt a .env file using sops and age. Generates a key if none exists.
set -euo pipefail
ENV_FILE="${1:-.env}"
AGE_KEY_FILE="${HOME}/.config/sops/age/keys.txt"
if [ ! -f "${AGE_KEY_FILE}" ]; then
  mkdir -p "$(dirname "${AGE_KEY_FILE}")"
  age-keygen -o "${AGE_KEY_FILE}"
  echo "Generated new age key at ${AGE_KEY_FILE}"
fi
PUB=$(grep "^# public key:" "${AGE_KEY_FILE}" | awk '{print $4}')
sops -e -a "${PUB}" "${ENV_FILE}" > "${ENV_FILE}.enc"
echo "Encrypted ${ENV_FILE} to ${ENV_FILE}.enc"
