# Tor sidecar for CLN (optional, safe)

This exposes your Core Lightning (CLN) node over a Tor onion service **without** exposing it on clearnet. Keys remain local in CLN.

## Files
- `lightning/tor/torrc` – Tor config with a HiddenService for CLN port 9735.
- `lightning/tor/compose.tor.yml` – compose fragment to run Tor next to CLN.

## Usage
1) Ensure your main Bitcoin/CLN compose is running (bitcoind + cln).
2) Start Tor sidecar (add `-f` to your main compose command if needed):
```bash
docker compose -f btc-compose.yml -f lightning/tor/compose.tor.yml up -d tor
```
3) Get your onion:
```bash
docker compose -f lightning/tor/compose.tor.yml exec tor \
  sh -lc 'cat /var/lib/tor/lightning/hostname || cat /var/lib/tor/hidden_service/lightning/hostname'
```
4) Share your onion with peers who connect via Tor. You do **not** need to expose port 9735 on the internet.

> NOTE: This is a sidecar; CLN must be reachable as `cln:9735` on the Docker network (the default if CLN’s service name is `cln`).
