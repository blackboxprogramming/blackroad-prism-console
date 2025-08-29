<!-- FILE: CLEANUP_PLAN.md -->
# Cleanup Plan

## Directory Overview
```
/ (repo root)
├── package.json                – Node project manifest (targets API)
├── server_full.js              – copy of API server (duplicate of srv/blackroad-api/server_full.js)
├── srv/
│   ├── blackroad-api/
│   │   ├── server_full.js      – primary Express + Socket.IO API (port 4000)
│   │   ├── server.js           – legacy minimal server
│   │   ├── controllers/, routes/, middleware/, scripts/
│   └── lucidia-llm/
│       └── app.py              – FastAPI LLM stub
├── var/
│   └── www/blackroad/
│       ├── index.html          – SPA entry point
│       ├── assets/brand/…      – brand assets (logos, demo.html, etc.)
│       ├── templates/, scripts/, server/
├── .github/
│   └── workflows/              – large collection of backup workflows
└── tests/                      – assorted Node smoke tests
```

## Findings

### (a) Obvious Dead Files / Assets
- `server_full.js` in repo root duplicates `srv/blackroad-api/server_full.js`.
- `srv/blackroad-api/server.js` appears unused; superseded by `server_full.js`.
- `var/www/blackroad/assets/brand/demo.html` (demo artifact not referenced).
- Numerous PDF documents and one-off HTML files at repo root (research papers, screenshots) unrelated to build.

### (b) Duplicate or Outdated Configs
- `.eslintrc.cjs` **and** `eslint.config.cjs` both present.
- Multiple environment samples: `.env`, `.env.example`, `.env.local.example`, `.env.docker.example`, `.env.aider`.
- Backup GitHub Actions: dozens of `_backup_132_*.yml` workflows cluttering `.github/workflows/`.

### (c) Unsafe Patterns
- `srv/blackroad-api/server_full.js` lacks helmet, rate limiting, structured CORS, and input validation.
- Default session secret (`dev-secret-change-me`) and default login credentials (`root / Codex2025`).
- `ALLOW_SHELL` option executes arbitrary shell commands via `exec`.
- Cookie session missing `secure` flag unless manually configured.

### (d) Missing Scripts/Tests
- No unified `npm test`/Jest suite for API; smoke tests are ad‑hoc.
- No tests validating `/health` or `/api/health`, CORS, or security headers.
- Python LLM stub lacks any pytest.
- No `health` script to ping health endpoints.
- No CI workflow running lint/format/tests.

## Risk Notes
- Replacing API middleware may accidentally alter `/health` or `/api/health` responses.
- Tightening CORS or session settings could block legitimate requests if env vars misconfigured.
- Removing duplicate server files requires confirming no external scripts rely on them.
- Moving assets from `var/www/blackroad` could break links if still referenced in HTML/JS.
