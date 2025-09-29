#!/usr/bin/env bash
# Alert when free space on the root filesystem drops below a threshold.
set -euo pipefail

thresh=${THRESHOLD:-10}
mount_point=${MOUNT_POINT:-/}

free=$(df -P "${mount_point}" | awk 'NR==2{print 100-$5}')
if [ -z "${free}" ]; then
  echo "[ERROR] Unable to determine free space for ${mount_point} at $(date -u '+%Y-%m-%dT%H:%M:%SZ')" >&2
  exit 1
fi

if [ "${free}" -lt "${thresh}" ]; then
  echo "[WARN] Low disk: ${free}% free on ${mount_point} at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
fi
