# Auth Service

FastAPI-based authentication service providing signup, login, token refresh, verification, and logout for the BlackRoad platform. Tokens are short-lived JWT access tokens paired with rotating refresh tokens persisted to the database.

## Getting Started

```bash
cd services/auth
poetry install
poetry run make dev
```

Copy `.env.example` to `.env` and adjust secrets for your environment.

## Key Commands

- `make dev` – run the service with autoreload
- `make lint` – run Ruff lint checks
- `make type` – run mypy
- `make test` – run pytest with coverage
- `make contract` – export OpenAPI and run schemathesis checks

## API Highlights

- `POST /signup`
- `POST /login`
- `POST /logout`
- `POST /tokens/refresh`
- `POST /tokens/verify`
- `GET /health`
- `GET /metrics`
- `GET /.well-known/jwks.json`

See `docs/auth-openapi.json` for the OpenAPI specification.
