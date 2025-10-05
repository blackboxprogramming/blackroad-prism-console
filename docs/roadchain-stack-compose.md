# RoadChain Compose Stack

This compose bundle launches the core RoadChain stack with three lightweight services that share a network and persistent volume:

- **Blockchain node** – exposes HTTP and WebSocket JSON-RPC endpoints and persists chain data on the `node_data` volume.
- **Wallet facade** – bridges application traffic to the node and waits for the node health check before starting.
- **Dashboard UI** – depends on the wallet service and surfaces a simple health probe.

The definition lives at [`compose/roadchain.yml`](../compose/roadchain.yml) and uses a project name of `roadchain` so it does not collide with other compose environments.

## Usage

1. Adjust the `image` fields to point at the container images for your deployment (e.g., RoadChain mainnet vs. testnet).
2. Store any sensitive values (mnemonics, API tokens) in a colocated `.env` file and reference them with `${VAR}`.
3. Start the stack with `docker compose -f compose/roadchain.yml up -d`.
4. Inspect health by hitting `http://localhost:3000/health` (dashboard), `http://localhost:8081/health` (wallet), or the node RPC at `http://localhost:8545`.

All services include sensible health checks and will restart automatically if they fail. The shared `node_data` volume keeps blockchain data across container restarts.
