#!/usr/bin/env bash
# /opt/blackroad/data/pitr.sh
set -euo pipefail
TARGET=${1:?timestamp required}
mc cp minio/backups/base-$TARGET.tar /tmp/base.tar
pg_restore /tmp/base.tar
