## Copilot / AI Agent instructions — BlackRoad Prism Console

This is a compact, actionable guide for automated coding agents working in this monorepo. Keep edits small, confirm with a maintainer for risky or scope-changing work, and prefer adding tests/docs alongside code changes.

Key facts (big picture)

- Monorepo layout: `srv/` (servers), `sites/` (frontends), `apps/` (standalones), `packages/` (shared libs).
- Runtime: Express API at `srv/blackroad-api` (entry: `server_full.js`) using SQLite and Socket.IO; frontend at `sites/blackroad` (Vite + React, dev port 5173); LLM bridge commonly at `srv/lucidia-llm/` (FastAPI stub, default 127.0.0.1:8000).

Quick dev commands

- Bootstrap (create .env, install deps): `bash ops/install.sh`
- Start API (dev): `cd srv/blackroad-api && npm run dev`
- Start frontend (dev from repo root): `npm run dev:site`

Repo rules & patterns you must follow

- Dependency hygiene: do not manually edit package.json for packages — run `node tools/dep-scan.js --dir <package>` or `bash ops/install.sh` and commit the tool's outputs only.
- Env vars: add or change defaults in `srv/blackroad-api/.env.example`.
- Feature flags: reuse existing flags (e.g. `BILLING_DISABLE`, `ALLOW_SHELL`) instead of adding global toggles.

Critical files to inspect before edits

- `srv/blackroad-api/server_full.js` — API entry/middleware
- `srv/blackroad-api/.env.example` — canonical env names
- `ops/install.sh`, `tools/dep-scan.js`, `tools/verify-runtime.sh` — installer and dependency tooling
- `docker-compose*.yml` — local orchestration and common ports (4000 / 5173 / 8000)
- `codex/`, `scripts/`, `tools/` — chat-first automation and deploy scaffolds

Integration notes & common pitfalls

- Many scripts assume an LLM at 127.0.0.1:8000 — prefer making that URL configurable via env and update `.env.example`.
- Stripe/webhook code lives under `srv/blackroad-api` — validate webhook signature handling in staging before production.
- Database defaults to a local SQLite file; avoid blind schema migrations and back up before changes.

PR & safety checklist (copy into PR body)

- Short summary (1-2 lines)
- Files changed and why
- Commands run (lint/test/build) and results
- Env vars added and `.env.example` updated? (yes/no)
- Any docker-compose or port changes? (yes/no)

Where to look first (recommended order)

1. `srv/blackroad-api/server_full.js`
2. `srv/blackroad-api/.env.example`
3. `ops/install.sh`, `tools/dep-scan.js`
4. `docker-compose*.yml`
5. `codex/`, `scripts/`, `tools/`

If you'd like, I can also add a short `.github/PULL_REQUEST_TEMPLATE.md` and an `AGENT_CHECKLIST.md` with the exact commands used for lint/test/dep-scan.

## When Copilot is enabled

If your organization enables GitHub Copilot agent features for this Codespace, Copilot will consult `.github/copilot-instructions.md` and may surface quick actions in the chat panel. Recommended additions for that flow:

- Keep the top of this file small and actionable (the agent reads it). Avoid long narrative sections.
- Emphasize imperative commands (e.g., `bash ops/install.sh`, `node tools/dep-scan.js --dir srv/blackroad-api --save`).
- Document any environment-specific defaults in `srv/blackroad-api/.env.example` (LLM_URL, PORT, DB_PATH).

For organization-level Copilot setup instructions, see `COPILOT_SETUP.md` in the repo root.

## Copilot / AI Agent instructions — BlackRoad Prism Console

This is a compact, actionable guide for automated coding agents working in this monorepo. Keep edits small, confirm with a maintainer for risky or scope-changing work, and prefer adding tests/docs alongside code changes.

Key facts (big picture)

- Monorepo layout: `srv/` (servers), `sites/` (frontends), `apps/` (standalones), `packages/` (shared libs).
- Runtime: Express API at `srv/blackroad-api` (entry: `server_full.js`) using SQLite and Socket.IO; frontend at `sites/blackroad` (Vite + React, dev port 5173); LLM bridge commonly at `srv/lucidia-llm/` (FastAPI stub, default 127.0.0.1:8000).

Quick dev commands

- Bootstrap (create .env, install deps): `bash ops/install.sh`
- Start API (dev): `cd srv/blackroad-api && npm run dev`
- Start frontend (dev from repo root): `npm run dev:site`

Repo rules & patterns you must follow

- Dependency hygiene: do not manually edit package.json for packages — run `node tools/dep-scan.js --dir <package>` or `bash ops/install.sh` and commit the tool's outputs only.
- Env vars: add or change defaults in `srv/blackroad-api/.env.example`.
- Feature flags: reuse existing flags (e.g. `BILLING_DISABLE`, `ALLOW_SHELL`) instead of adding global toggles.

Critical files to inspect before edits

- `srv/blackroad-api/server_full.js` — API entry/middleware
- `srv/blackroad-api/.env.example` — canonical env names
- `ops/install.sh`, `tools/dep-scan.js`, `tools/verify-runtime.sh` — installer and dependency tooling
- `docker-compose*.yml` — local orchestration and common ports (4000 / 5173 / 8000)
- `codex/`, `scripts/`, `tools/` — chat-first automation and deploy scaffolds

Integration notes & common pitfalls

- Many scripts assume an LLM at 127.0.0.1:8000 — prefer making that URL configurable via env and update `.env.example`.
- Stripe/webhook code lives under `srv/blackroad-api` — validate webhook signature handling in staging before production.
- Database defaults to a local SQLite file; avoid blind schema migrations and back up before changes.

PR & safety checklist (copy into PR body)

- Short summary (1-2 lines)
- Files changed and why
- Commands run (lint/test/build) and results
- Env vars added and `.env.example` updated? (yes/no)
- Any docker-compose or port changes? (yes/no)

Where to look first (recommended order)

1. `srv/blackroad-api/server_full.js`
2. `srv/blackroad-api/.env.example`
3. `ops/install.sh`, `tools/dep-scan.js`
4. `docker-compose*.yml`
5. `codex/`, `scripts/`, `tools/`

If you'd like, I can also add a short `.github/PULL_REQUEST_TEMPLATE.md` and an `AGENT_CHECKLIST.md` with the exact commands used for lint/test/dep-scan.
