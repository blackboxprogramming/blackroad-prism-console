# <!-- FILE: /ops/backup/restic_setup.sh -->
#!/usr/bin/env bash
set -euo pipefail

export RESTIC_REPOSITORY="s3:http://minio:9000/lucidia-backups"
export RESTIC_PASSWORD="restic_pass"
export AWS_ACCESS_KEY_ID="minio"
export AWS_SECRET_ACCESS_KEY="minio123"

restic init || true
