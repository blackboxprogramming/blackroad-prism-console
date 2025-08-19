#!/bin/bash
set -euo pipefail
DEST=ssh://mirror/srv/backup
borg create --stats $DEST::$(date +%F) /srv/data
