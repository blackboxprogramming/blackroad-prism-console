# Lucidia Metadata & Catalog (LMC)

This directory contains an early skeleton for the Lucidia/BlackRoad metadata management system.

## Layout

- `docker-compose.yml` – local development stack (Postgres, Fuseki, API).
- `services/api` – FastAPI service exposing REST and GraphQL stubs.
- `schemas` – placeholder JSON Schemas (DCAT 3.0, STAC 1.0, UMM).
- `web` – React admin UI stub.

The implementation is intentionally minimal and independent from NASA CMR
or Earthdata services.  It serves as a starting point for further work.

_Last updated on 2025-09-11_
