# RoadGlitch Service

RoadGlitch is an automation engine for defining and executing deterministic workflows via a FastAPI surface. It ships with built-in connectors, idempotent run execution, metrics, and authentication suitable for local development.

## Getting Started

```bash
cd services/roadglitch
poetry install
make dev
```

The service listens on `http://localhost:8080`. Authenticate requests with `Authorization: Bearer dev-token` by default.

## Key Endpoints

- `POST /workflows` — Create or update a workflow from JSON/YAML payloads.
- `POST /runs` — Start a run by workflow id or name/version with optional idempotency key.
- `GET /runs/{id}` — Inspect run status and logs.
- `POST /validate` — Validate a workflow spec without persisting it.
- `POST /dry-run` — Return execution plan without side effects.
- `GET /health` — Service health snapshot.
- `GET /metrics` — Prometheus metrics.

## Example Workflow

```json
{
  "name": "notify_slow_api",
  "version": "1.0.0",
  "trigger": {"type": "manual"},
  "graph": {
    "nodes": {
      "ping_api": {
        "uses": "connector.http.get",
        "with": {"url": "https://httpbin.org/delay/1"}
      },
      "notify": {
        "uses": "connector.slack.postMessage",
        "with": {
          "channel": "#ops",
          "text": "API responded"
        }
      }
    },
    "edges": [
      {"from": "ping_api", "to": "notify"}
    ]
  }
}
```

## Observability

- Structured logs emitted via `structlog` including run identifiers.
- Prometheus metrics exported at `/metrics`, including run and node duration histograms.

## Safety

- Mock mode on by default; shell connector disabled unless `ALLOW_SHELL=true` and configuration allows it.
- Rate limiting middleware enforces 60 requests per minute per token.

