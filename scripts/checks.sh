#!/usr/bin/env bash
set -euo pipefail
echo "== count-objects =="
git -C ~/lucidia count-objects -vH || true
echo "== nginx =="
sudo nginx -t && systemctl is-active nginx || true
echo "== api =="
systemctl is-active blackroad-api || true
curl -fsS http://127.0.0.1:4000/api/health.json || true
echo "== site =="
curl -I -s http://127.0.0.1 | head -1 || true
