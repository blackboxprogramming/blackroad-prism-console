#!/bin/bash
set -euo pipefail
SRC=ssh://mirror/srv/backup
SNAP=${1:?snapshot required}
borg extract $SRC::$SNAP /srv/data
