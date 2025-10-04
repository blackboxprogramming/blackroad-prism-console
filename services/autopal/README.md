# AutoPal FastAPI Service

This directory contains the FastAPI implementation for the AutoPal materialization service.
It exposes a single `POST /secrets/materialize` endpoint that validates OpenID Connect
ID tokens, enforces step-up headers, and applies per-subject rate limits.

The service supports both in-process and Redis-backed rate limiting. When the
`REDIS_URL` environment variable is present the Redis backend is used, otherwise
an in-memory fallback is applied. Default OIDC settings target the local mock
issuer defined in the docker-compose stack under `stack/autopal-fastapi`.
