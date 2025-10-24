# Control Plane MVP — Getting Started

Welcome to the Unified Control Plane spike. This guide walks you through running the GraphQL gateway, authenticating with the CLI, executing a deploy, and viewing the audit trail.

## Prerequisites

- Node.js 18+
- pnpm 9+
- Docker (optional; not required for the MVP)

## 1. Install dependencies

```bash
pnpm install
```

## 2. Bootstrap environment

Copy the example environment variables and fill in local defaults:

```bash
cp .env.example .env
```

Populate:

- `OIDC_ISSUER` — set to `http://localhost:4000/oidc-stub`
- `LOCAL_DEV_TOKEN` — choose any UUID; referenced by the CLI

## 3. Start the stack

```bash
pnpm dev:control-plane
```

This composite script (defined in the root `package.json`) starts:

1. `packages/control-plane-gateway` in watch mode on port 4100
2. `packages/blackroadctl` CLI watcher for quick re-runs
3. `sites/blackroad` dashboard in dev mode

## 4. Create a service

```bash
pnpm --filter control-plane-gateway run seed
```

The seed command loads demo services, environments, releases, and incidents into the gateway's JSON store (`var/control-plane/state.json`).

## 5. Run a deploy

```bash
pnpm --filter blackroadctl exec blackroadctl deploy create \
  --service svc-demo \
  --env staging \
  --sha 9f3b7de
```

The CLI prints the audit event produced by the gateway, including release and workflow IDs.

## 6. Promote a release

```bash
pnpm --filter blackroadctl exec blackroadctl deploy promote \
  --release rel-svc-demo-staging \
  --to prod
```

## 7. Inspect status and incidents

```bash
pnpm --filter blackroadctl exec blackroadctl ops status --service svc-demo
pnpm --filter blackroadctl exec blackroadctl ops incidents recent --service svc-demo
```

## 8. View the dashboard

Open [http://localhost:3000/ops/control-plane](http://localhost:3000/ops/control-plane) to view services, releases, and the recent audit log tail.

## Active Reflection

- *What decisions sped up vs slowed down?*
- *Where did we duplicate state we could derive?*
