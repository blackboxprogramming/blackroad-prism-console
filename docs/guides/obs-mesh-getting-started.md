# Observability Mesh — Getting Started

This guide walks through running the mesh locally, exploring the correlation engine, and visualizing events in the Ops
Timeline UI.

## Prerequisites

- Node.js 18+
- `pnpm` or `npm`
- Docker (optional; for running collectors)

## Install & Build

```bash
pnpm install
pnpm --filter @blackroad/obs-mesh test
pnpm --filter @blackroad/correlation-engine test
pnpm --filter @blackroad/obs-gateway test
```

## Run the Mesh Locally

1. Start the gateway (in dev mode it uses the in-process bus and memory store):

   ```bash
   node -e "const { createGateway } = require('./packages/obs-gateway/dist/index.js'); const gateway = createGateway(); console.log('Gateway ready');"
   ```

2. Publish synthetic events:

   ```bash
   node -e "const { createGateway } = require('./packages/obs-gateway/dist/index.js'); const { createEnvelope } = require('./packages/obs-mesh/dist/envelope.js'); const gateway = createGateway(); gateway.publish(createEnvelope({ ts: new Date(), source: 'audit', service: 'deploy', kind: 'audit', releaseId: 'rel-local', attrs: { action: 'deploy.create' } })); console.log('Emitted event');"
   ```

3. Stream events via SSE:

   ```bash
   curl -N http://localhost:4100/events/stream
   ```

4. Correlate via GraphQL query:

   ```bash
   curl -X POST http://localhost:4100/graphql \
     -H 'Content-Type: application/json' \
     -d '{"query":"{ correlate(key: \"rel-local\", keyType: \"releaseId\") { key notes timeline { source service kind } } }"}'
   ```

## CLI Usage

- Tail events:

  ```bash
  BLACKROADCTL_ROLE=operator node packages/blackroadctl/dist/bin/blackroadctl.js obs tail --filter '{"service":["control-plane-gateway"]}'
  ```

- Correlate timelines:

  ```bash
  BLACKROADCTL_ROLE=operator node packages/blackroadctl/dist/bin/blackroadctl.js obs correlate --key rel-local --keyType releaseId
  ```

## Ops Timeline UI

- Run the Next.js site: `npm --prefix sites/blackroad run dev`
- Navigate to `/ops/observability-timeline`
- Adjust filters to view ingested events refreshed every 5 seconds.

## Grafana Panels

- Import the dashboard JSON located in `observability/dashboards/mesh-overview.json` (placeholder) and hook Prometheus
  targets to scrape the mesh metrics: `mesh_ingest_events_total`, `mesh_ingest_lag_seconds`, `mesh_dedupe_dropped_total`.

