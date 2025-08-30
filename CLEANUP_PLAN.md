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

### (a) Obvious Dead Files / Assets

- `srv/blackroad-api/server.js` superseded by `server_full.js`.
- Legacy configs in `srv/blackroad-api` (`.eslintrc.json`, `package.json`, `.env.example`).
- Committed environment files at repo root (`.env*`).
- Unreferenced scaffold `var/www/blackroad/blackroad-io-scaffold.html`.

### (b) Duplicate or Outdated Configs

- `eslint.config.cjs` duplicates `.eslintrc.cjs`.
- Multiple environment samples in repo root (`.env.example`, `.env.local.example`, `.env.docker.example`).
- Duplicate `package.json` inside `srv/blackroad-api/`.

### (c) Unsafe Patterns

- `server_full.js` lacks top-level `/health` route (only `/api/health`).
- Default session secret and `root/Codex2025` credentials left in code.
- `ALLOW_SHELL` flag permits shell execution when enabled.

### (d) Missing Scripts/Tests

- No Jest coverage for root `/health` or security headers.
- Python LLM stub has no pytest.
- `Makefile` lacks common `dev`, `start`, `format`, `lint`, and `test` targets.
- No CI workflow to run format, lint, and tests.

## Risk Notes

- Tightening CORS or session settings could block valid clients if env vars mis‑set.
- Removing env files or configs may disrupt developer workflows.
- Moving frontend assets might break unseen references.
- Adding middleware must not alter `/health` or `/api/health` semantics.
