<!-- FILE: CLEANUP_PLAN.md -->

# Cleanup Plan

## Directory Overview

```
/ (repo root)
├── package.json                – Node project manifest for API
├── srv/
│   ├── blackroad-api/          – Express + Socket.IO backend
│   │   ├── server_full.js      – primary API server (port 4000)
│   │   ├── server.js           – legacy minimal server
│   │   ├── routes/, controllers/, middleware/
│   └── lucidia-llm/
│       └── app.py              – FastAPI LLM stub
└── var/
    └── www/blackroad/          – frontend SPA (index.html and assets)
```

## Findings

# Cleanup Plan

## Inventory

- **API**: `srv/blackroad-api` (server_full.js, SQLite DB).
- **SPA**: `var/www/blackroad/index.html` single-page app.
- **LLM Stub**: `srv/lucidia-llm/app.py` FastAPI stub.

## Tasks

1. Harden API security with Helmet, rate limiting, strict CORS from `ALLOW_ORIGINS`, body size limits, and minimal input validation.
2. Enforce environment hygiene: provide `.env.sample`, fail fast if required env vars missing, audit and remove committed secrets/logs.
3. Preserve `/health` and `/api/health` responses.
4. Apply Prettier and ESLint formatting (Node 20).
5. Add smoke tests: Jest for API health/security headers, Pytest for LLM stub import.
6. Add structured request logging (method, path, status, duration, request id).
7. Prepare RUNME script, rollback guidance, changelog, and results summary.

## Deletions

- Move tracked `logs/` directories to `_trash/` with restoration notes.
