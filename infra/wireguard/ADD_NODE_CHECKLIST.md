<!-- FILE: /infra/wireguard/ADD_NODE_CHECKLIST.md -->
# Add Node Checklist

1. Run `infra/wireguard/gen-peers.sh peer1`.
2. Append peer config to `wg0.conf` on existing nodes.
3. Copy generated files to new node and start WireGuard.
4. Apply `infra/hardening/secure-ssh.sh` and `infra/hardening/ufw.sh`.
