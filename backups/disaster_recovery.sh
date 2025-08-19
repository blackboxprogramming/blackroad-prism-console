#!/bin/bash
set -euo pipefail

# Rebuild node from bare OS using local mirrors
bash provision/00_sys.sh
bash provision/10_pkgs.sh
bash provision/20_wireguard.sh
restic -r ssh:backup1:/srv/backups restore latest --target /
