#!/bin/bash
set -euo pipefail
ssh core "docker compose -f /srv/infrastructure/docker-compose.yml stop"
ssh mirror "docker compose -f /srv/infrastructure/docker-compose.yml up -d"
