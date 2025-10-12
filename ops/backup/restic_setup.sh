# <!-- FILE: /ops/backup/restic_setup.sh -->
#!/usr/bin/env bash
set -euo pipefail

export RESTIC_REPOSITORY="s3:http://minio:9000/lucidia-backups"
export RESTIC_PASSWORD="restic_pass"

: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID before running restic_setup.sh (use short-lived credentials from your identity provider).}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY before running restic_setup.sh (use short-lived credentials from your identity provider).}"
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

restic init || true
