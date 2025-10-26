# RoadView Search Service

RoadView Search Service provides a credibility-aware hybrid ranking API powering the RoadView web client. It exposes endpoints for ingestion, domain registry management, and search with transparent scoring breakdowns.

## Features

- FastAPI application with structured logging and Prometheus metrics.
- SQLite storage via SQLModel with async execution.
- Deterministic hybrid ranking combining TF-IDF relevance, domain credibility, recency, and structure quality.
- Faceted filters and pagination for search responses.
- Bulk ingestion and curated seed loader for deterministic fixtures.
- Domain registry with policy enforcement (`allow`, `noindex`, `block`).
- Contract tests against the generated OpenAPI schema.

## Getting Started

```bash
poetry install
cp .env.example .env
poetry run make dev
```

Run the full test suite:

```bash
poetry run make test
```

See the `Makefile` for additional commands.
