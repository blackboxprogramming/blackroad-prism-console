<!-- FILE: /infra/wireguard/ADD_NODE.md -->
# Adding a WireGuard Node

1. On the new node, generate keys:
   ```bash
   umask 077
   wg genkey | tee privatekey | wg pubkey > publickey
   ```
2. Append `name,pubkey,ip` to `infra/wireguard/peers.csv`.
3. Run `./infra/wireguard/gen-peers.sh infra/wireguard/peers.csv`.
4. Copy the resulting `wg0.conf` to `/etc/wireguard/wg0.conf` on the new node.
5. Start the interface:
   ```bash
   wg-quick up wg0
   ```
6. Verify connectivity and update UFW on peers if needed.
