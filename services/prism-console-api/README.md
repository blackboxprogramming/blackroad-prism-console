# Prism Console API

The Prism Console API powers operator dashboards for BlackRoad mobile and web clients. It is a FastAPI service that exposes dashboards, agents, and runbooks information. This project ships with a mock mode for offline development and seeds the local SQLite database with representative data.

## Quickstart

```bash
poetry install
poetry run uvicorn prism.main:app --reload --port 4000
```

Run tests with:

```bash
poetry run pytest
```

See `docs/` for additional API documentation and exported OpenAPI schemas.
