# RoadView Search Service

RoadView Search Service provides a credibility-aware ranking API used by the RoadView web experience. It exposes ingestion, search, and registry endpoints with transparent scoring and observability hooks.

## Features

- FastAPI application with structured logging and Prometheus metrics
- SQLite persistence powered by SQLModel with async access
- Hybrid ranking that combines TF-IDF relevance, domain credibility, recency, and structural quality
- Domain registry with policy enforcement (`allow`, `noindex`, `block`)
- Bulk ingestion and curated seed loader for deterministic local data
- Transparent score breakdowns and per-result confidence scaling
- Pagination, filtering, and sorting across relevance, credibility, recency, and domain name

## Getting Started

1. Install dependencies with [Poetry](https://python-poetry.org/):

   ```bash
   poetry install
   ```

2. Copy the example environment file and adjust values as needed:

   ```bash
   cp .env.example .env
   ```

3. Launch the development server:

   ```bash
   make dev
   ```

   The API will start on `http://localhost:4001` by default.

## Key Commands

- `make lint` – run Ruff for linting
- `make type` – run mypy static checks
- `make test` – run pytest with coverage
- `make openapi` – export the OpenAPI document to `docs/roadview-openapi.json`
- `make contract` – execute schemathesis contract tests (requires service running)

## Observability

- Logs are emitted in structured JSON with request metadata and timing
- Prometheus metrics are available at `/metrics` (enabled by default)
- Health information is exposed at `/health`

## Testing

The repository includes unit, integration, and contract tests. To run them all:

```bash
make test
```

Coverage reports target at least 80% of the `src` directory.

## Deployment

A Dockerfile and GitHub Actions workflow are provided. The workflow runs linting, typing, tests, contract checks, and builds the container image.
