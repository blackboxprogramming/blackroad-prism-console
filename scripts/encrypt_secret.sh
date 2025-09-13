#!/usr/bin/env bash
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
