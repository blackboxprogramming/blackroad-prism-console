# API Gateway

Fastify-based entrypoint for the BlackRoad ecosystem. Handles authentication fan-out to the Auth Service, request tracing, and routing to downstream services.

## Getting Started

```bash
pnpm install
pnpm --filter api-gateway dev
```

Gateway listens on `http://localhost:8080` by default.

### Environment

Copy `.env.example` to `.env` or export variables in your shell.

### Quality Gates

```bash
pnpm --filter api-gateway lint
pnpm --filter api-gateway test
pnpm --filter api-gateway build
```

Tests cover auth middleware, contract validation for `/mobile/dashboard`, and basic routing.

### Docker

```bash
make build
podman build -t blackroad/api-gateway .
```

`docker-compose.dev.yml` boots the gateway alongside mock services for local development.

### Release Checklist

1. `pnpm --filter api-gateway build`
2. Update `openapi.yaml`
3. Tag `v0.1.0-api-gateway` on merge.
