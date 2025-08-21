#!/bin/bash
set -euo pipefail

RESTIC_REPOSITORY="ssh:backup1:/srv/backups"
restic -r "$RESTIC_REPOSITORY" restore latest --target /
