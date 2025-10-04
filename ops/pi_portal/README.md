# Pi Portal QR + Tor Bootstrap

This bootstrap script provisions robust PSBT QR tooling and an optional
Tor-protected health endpoint for the Pi portal environment. Run it on the
portal host (defaults to `/home/pi/portal`, override with `PORTAL_ROOT`) after
installing the system dependencies.

## Features

- Generates resilient PSBT QR chunks with manifests and checksum verification.
- Provides CLI utilities to reassemble PSBT chunks (online or offline).
- Installs helper scripts for managing a Caddy reverse proxy with HTTP Basic
  Auth in front of the read-only health endpoint.
- Configures a Tor hidden service that exposes the protected health page.

## Requirements

- `qrencode`, `zbarimg`, `sha256sum`, `jq`
- `caddy` for the Basic-Auth reverse proxy
- `tor` service with permissions to manage `/var/lib/tor`
- `ss` from `iproute2` for the health helper script

## Usage

```bash
sudo apt-get install -y qrencode zbar-tools jq caddy tor
PORTAL_ROOT=/home/pi/portal ./bootstrap.sh
```

After running the bootstrap:

1. Encode unsigned PSBTs: `psbt-to-qr-robust /home/pi/portal/psbts/LABEL.psbt`
2. Reassemble signed PSBTs from QR captures: `qr-to-psbt-robust ...`
3. Copy `/home/pi/portal/bin/offline-joiner.sh` onto the signer for air-gapped
   reassembly.
4. Restart Tor and Caddy via the script, then read the onion address from
   `portal-health-auth` output. Update credentials with `caddy-setpass`.

> **Security note:** The scripts never touch private keys or seed phrases.
> They only operate on PSBT payloads and health endpoints.
