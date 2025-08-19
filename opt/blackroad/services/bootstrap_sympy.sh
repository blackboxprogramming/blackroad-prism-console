#!/usr/bin/env bash
set -euo pipefail
mkdir -p /opt/blackroad/services
cd /opt/blackroad/services
if [ ! -d sympy_gamma ]; then
  git clone https://github.com/sympy/sympy_gamma.git
fi
cd /opt/blackroad
docker compose build sympy-gamma sympy-api
docker compose up -d sympy-gamma sympy-api

