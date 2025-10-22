# Safe Address Agent

This lightweight Node 20 HTTP service exposes masked summaries of configured wallet addresses. It is designed for Raspberry Pi deployments that need a quick health endpoint without ever printing raw secrets.

## Prerequisites

1. Install Node.js 20 on the device (using `nvm`, `asdf`, or the official NodeSource packages).
2. Clone or copy the `agent` directory to `/home/pi/app/agent`.
3. Populate `/etc/default/node-agent` with exported environment variables:

```bash
ROBINHOOD_ETHEREUM=...
COINBASE_BITCOIN=...
# etc.
```

## Build & run

```bash
cd /home/pi/app
npm install
npm run build:agent
npm run start:agent
```

The server listens on port `8080` by default. Set `PORT` in `/etc/default/node-agent` to override.

## Systemd installation

```bash
sudo cp agent/systemd/agent.service /etc/systemd/system/agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now agent.service
```

Verify it is running:

```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/addresses
```

Both endpoints return JSON with masked secrets and SHA-256 digests truncated to eight characters.
