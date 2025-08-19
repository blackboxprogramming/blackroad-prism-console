#!/usr/bin/env bash
set -euo pipefail
cd /opt/blackroad/symbol-gateway
cargo build --release
install -Dm755 target/release/symbol-gateway /usr/local/bin/symbol-gateway
systemctl daemon-reload
systemctl enable --now symbol-gateway.service
echo "OK -> http://127.0.0.1:8087/healthz"
