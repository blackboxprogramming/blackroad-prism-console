# <!-- FILE: /ops/scripts/test-restore.sh -->
#!/usr/bin/env bash
set -euo pipefail

source ../backup/restic.env
restic restore latest --target /tmp/restore-test
