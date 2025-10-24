# Tokenomics Simulator — Getting Started

This guide walks through running a deterministic simulation, generating evidence, and exploring the results via the CLI, SDK, and UI lab.

## Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   pnpm --filter @blackroad/tokenomics-sim build
   pnpm --filter economy-gateway build
   pnpm --filter @blackroad/economy-sdk build
   pnpm --filter blackroadctl build
   ```
2. Copy `.env.example` to `.env` and populate:
   ```dotenv
   ECONOMY_GATEWAY_ENDPOINT=http://localhost:4600/graphql
   ECONOMY_SIGNING_KEY=dev-signing-key
   DEV_TOKEN=dev-token-example
   ```

## Run the Gateway

```bash
pnpm --filter economy-gateway dev
```

The server exposes a GraphQL endpoint at `/graphql` and streams simulation events over Server Sent Events.

## Define a Scenario

Create `scenario.linear.json`:

```json
{
  "kind": "linear",
  "startDate": "2025-01-01",
  "horizonMonths": 12,
  "params": {
    "initialSupply": 1000000,
    "emissionPerMonth": 25000,
    "maxSupply": 1500000
  }
}
```

## Run a Simulation via CLI

```bash
blackroadctl economy simulate --scenario ./scenario.linear.json --seed 7 --out ./artifacts/latest
```

The command prints audit events and copies artifacts into `./artifacts/latest`.

Inspect evidence:

```bash
blackroadctl economy evidence --id <simulationId> --open
```

Plot circulating supply:

```bash
blackroadctl economy graph --id <simulationId> --metric circulating
```

## Use the SDK

```ts
import { EconomyClient } from '@blackroad/economy-sdk';

const client = new EconomyClient({
  endpoint: process.env.ECONOMY_GATEWAY_ENDPOINT!,
  token: process.env.ECONOMY_GATEWAY_TOKEN
});

async function run() {
  const simulation = await client.createSimulation({
    scenario: require('./scenario.linear.json'),
    seed: 42
  });

  await client.runSimulation(simulation.id);

  for await (const event of client.subscribeSimulationEvents(simulation.id)) {
    console.log('status', event.status, event.summary);
  }
}

run();
```

## Explore in Tokenomics Lab

Visit `/labs/TokenomicsLab` in RoadStudio. The lab includes:

- Scenario editor with presets.
- Live event log sourced from the GraphQL subscription.
- Evidence preview with invariant status.
- Active Reflection prompts to drive governance reviews.

