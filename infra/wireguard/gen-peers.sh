# <!-- FILE: /infra/wireguard/gen-peers.sh -->
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "usage: $0 peer_name" >&2
  exit 1
fi

wg genkey | tee "$1.key" | wg pubkey > "$1.pub"
