#!/bin/bash
set -euo pipefail

touch /var/lib/lucidia/READ_ONLY
systemctl stop lucidia.service
docker compose -f compose/lucidia.yml up -d
