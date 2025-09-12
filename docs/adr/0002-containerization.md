# ADR 0002: Containerization Strategy

## Status

Accepted

## Context

Developers need a reproducible environment for local development and deployment
of the Prism service.

## Decision

Provide a dedicated `Dockerfile` and `docker-compose.yml` that orchestrate the
Prism server alongside Postgres and an S3-compatible store (MinIO) for staging.

## Consequences

Containers ensure parity between development and production. Localstack
dependencies are optional, and images can be pushed to GHCR via CI.
