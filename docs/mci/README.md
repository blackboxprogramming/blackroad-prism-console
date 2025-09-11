# MCI API

This module provides a minimal Math×Code Integrator (MCI) service.

## Endpoints

- `POST /api/mci/compute` – evaluate a mathematical expression using a Python sandbox.
- `GET /api/mci/health` – report enabled capabilities and cache stats.

## Example

```bash
curl -X POST http://localhost:4000/api/mci/compute \
  -H 'Content-Type: application/json' \
  -d '{"expr":"1+1","mode":"numeric"}'
```

## Rollback

Remove the router mount in `server_full.js` and delete the `srv/blackroad-api/mci` directory.

_Last updated on 2025-09-11_
