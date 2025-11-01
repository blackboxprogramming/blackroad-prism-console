#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXAMPLE_FILE="${REPO_ROOT}/.env.example"
TARGET_FILE="${REPO_ROOT}/.env"

if [[ ! -f "${EXAMPLE_FILE}" ]]; then
  echo "Error: ${EXAMPLE_FILE} not found." >&2
  exit 1
fi

declare -A env_file_values
if [[ -f "${TARGET_FILE}" ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" ]] && continue
    [[ "$key" =~ ^# ]] && continue
    env_file_values["$key"]="${value}"
  done < <(grep -E '^[A-Za-z0-9_]+=' "${TARGET_FILE}" || true)
fi

function read_value() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    printf '%s' "${!name}"
    return 0
  fi
  if [[ -n "${env_file_values[$name]:-}" ]]; then
    printf '%s' "${env_file_values[$name]}"
    return 0
  fi
  return 1
}

missing_required=()
missing_optional=()

while IFS= read -r line || [[ -n "$line" ]]; do
  trimmed="${line#${line%%[![:space:]]*}}"
  if [[ -z "$trimmed" ]] || [[ "$trimmed" == \#* ]]; then
    continue
  fi
  name="${line%%=*}"
  desc="${line#*=}"
  optional=false
  if [[ "$desc" == "(optional)"* ]]; then
    optional=true
  fi
  if read_value "$name" > /dev/null; then
    continue
  fi
  if [[ "$optional" == true ]]; then
    missing_optional+=("$name")
  else
    missing_required+=("$name")
  fi

done < "${EXAMPLE_FILE}"

if ((${#missing_required[@]})); then
  echo "Missing required environment variables:" >&2
  for item in "${missing_required[@]}"; do
    echo "  - $item" >&2
  done
fi

if ((${#missing_optional[@]})); then
  echo "Optional variables not set:" >&2
  for item in "${missing_optional[@]}"; do
    echo "  - $item" >&2
  done
fi

if ((${#missing_required[@]})); then
  exit 1
fi

if ((${#missing_optional[@]})); then
  exit 2
fi

echo "All required environment variables are present." >&2
exit 0
