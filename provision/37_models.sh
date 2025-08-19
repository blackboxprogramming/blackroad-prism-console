#!/bin/bash
set -euo pipefail

curl -fsSL https://ollama.ai/install.sh | sh
mkdir -p /srv/models
# Models are copied manually to /srv/models
