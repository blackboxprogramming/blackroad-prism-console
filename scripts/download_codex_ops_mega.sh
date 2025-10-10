#!/usr/bin/env bash
set -euo pipefail

BUNDLE_NAME="codex-ops-mega.zip"
DOWNLOAD_DIR="${DOWNLOAD_DIR:-downloads}"
TARGET_PATH="${DOWNLOAD_DIR}/${BUNDLE_NAME}"
TMP_PATH="${TARGET_PATH}.tmp"

if [[ -z "${CODEX_OPS_MEGA_URL:-}" ]]; then
  echo "error: CODEX_OPS_MEGA_URL is not set" >&2
  exit 1
fi

mkdir -p "${DOWNLOAD_DIR}"

echo "Downloading ${BUNDLE_NAME} from ${CODEX_OPS_MEGA_URL}..."
if ! curl -fL "${CODEX_OPS_MEGA_URL}" -o "${TMP_PATH}"; then
  echo "warning: download failed" >&2
  [[ -f "${TMP_PATH}" ]] && rm -f "${TMP_PATH}"
  exit 1
fi

if [[ -n "${CODEX_OPS_MEGA_SHA256:-}" ]]; then
  echo "Verifying checksum..."
  DOWNLOADED_SUM=$(sha256sum "${TMP_PATH}" | awk '{print $1}')
  if [[ "${DOWNLOADED_SUM}" != "${CODEX_OPS_MEGA_SHA256}" ]]; then
    echo "error: checksum mismatch" >&2
    rm -f "${TMP_PATH}"
    exit 1
  fi
fi

mv "${TMP_PATH}" "${TARGET_PATH}"
echo "Saved bundle to ${TARGET_PATH}"
