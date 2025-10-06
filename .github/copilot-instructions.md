# Copilot instructions — BlackRoad Prism Console

This file gives concise, actionable guidance for an AI coding agent working in this repository. Keep answers short and changes minimal: prefer edits in the same style as surrounding files.

Key goals
- Preserve existing behavior and CI. When in doubt, run the project scripts (`npm run build`, `npm test`) and follow failures.
- Respect repository conventions (see `AGENTS.md` files and `package.json` scripts).

What this repo is (big picture)
- A collection of experimental tooling and prototypes for BlackRoad.io. Main pieces:
  - `sites/blackroad/`: frontend (Vite/SPA) for the BlackRoad site. Use `npm --prefix sites/blackroad run dev|build`.
  - `srv/blackroad-api/` (referenced in `package.json`): Express + SQLite API; entry `srv/blackroad-api/server_full.js`.
  - `codex/`, `scripts/`: chat-first scaffolding and deployment helpers used by Ops bots.
  - `agents/`: small Python agent experiments (follow PEP8 and docstrings).
  - Docker compose orchestrates services (DBs, redis, nginx) for full stack local runs.

Critical developer workflows (commands you can run)
- Quick dev (backend):
  - npm install (project root) then start API dev server:

    ```bash
    npm install
    npm run dev
    ```

- Frontend dev/build:

    ```bash
    npm --prefix sites/blackroad install
    npm --prefix sites/blackroad run dev   # local frontend dev
    npm --prefix sites/blackroad run build # static build
    ```

- Tests & checks:

    ```bash
    npm test           # runs jest tests (e.g. tests/api_health.test.js)
    npm run lint       # eslint configured for specific files
    npm run format     # prettier
    ```

- Quick smoke for full stack (uses Docker Compose):

    ```bash
    docker compose up --build
    # or docker-compose up --build (older envs)
    ```

Project-specific conventions & patterns
- Scripts are centralized in `package.json`. Use them instead of running JS files directly to ensure environment is applied (examples: `npm run health`, `npm run dev:site`).
- Chat-first control scripts: `codex/tools/*` and `scripts/*` accept natural language-like commands (see `scripts/blackroad_sync.py` and `codex/tools/blackroad_pipeline.py`). When editing these, preserve the mapping between phrases and actions.
- If adding JS/TS code, follow the lint-staged rules defined in `package.json` (eslint + prettier) to avoid CI failures.
- Python agents live under `agents/` — check `agents/AGENTS.md` for agent run commands (some expect `python auto_novel_agent.py`).

Integration points & external dependencies
- External services expected in environments:
  - LLM stub usually on 127.0.0.1:8000 (see AGENTS/README notes).
  - Express API expects SQLite or other DBs; Docker compose defines Redis, Mongo, Postgres for full-stack tests.
  - Cloudflare (cache purge/warm) used by site ops; CF tokens are required for those chatops.
- Key files referencing integrations:
  - `package.json` (scripts and deps)
  - `docker-compose.yml` (service matrix, healthchecks, env names)
  - `sites/blackroad/content/*` (blog content, frontend build affects these)

Patterns & examples from the codebase
- Use npm "--prefix" for site-specific commands:
  - `npm --prefix sites/blackroad run build`
- Codex/chat-run scripts expect English-like commands. Example:
  - `python scripts/blackroad_ci.py "Push latest to BlackRoad.io"`
- Bot-driven PR fixes: the repo contains `.github/prompts/codex-fix-anything.md` and a script `npm run fix-anything` which invokes a codex apply wrapper. Use the wrapper to propose automated fixes rather than directly committing large refactors.

When editing infrastructure or ops code
- Be conservative: these scripts are run by bots and humans. Add tests where possible and update `README.md` or `AGENTS.md` to document new commands.
- Preserve environment variable names (many scripts rely on `DROPLET_HOST`, `WORKING_COPY_PATH`, `REDIS_URL`, `MONGO_URL_BLACKROAD`, `JWT_SECRET`).

Useful files to inspect (start here)
- `AGENTS.md` (root) — repo-level guidance and conventions
- `agents/AGENTS.md` — how to run sample agents
- `package.json` — canonical scripts, dependencies, lint rules
- `docker-compose.yml` — service topology and healthchecks
- `sites/blackroad/` — frontend code & content pipeline
- `srv/blackroad-api/server_full.js` — API entrypoint referenced by scripts
- `codex/tools/` and `scripts/` — chat-first automation helpers

STOP criteria and testing
- Run `npm test` and `npm run lint` after substantive changes.
- For infra/ops edits, run `docker compose up --build` locally (or validate script output) and check health endpoints (e.g., `npm run health` if available).

If you need to make a change
- Make the minimal change required, run scripts locally, and open a PR.
- If the change touches bot or deploy scripts, add a one-line changelog entry in `CHANGELOG.md` and update the relevant `AGENTS.md` section.

# Copilot instructions — BlackRoad Prism Console

This repository contains experimental tooling and ops scaffolding for BlackRoad.io. The guidance below focuses on the concrete, discoverable patterns that help an automated coding agent be productive immediately: where to run things, expected inputs/outputs, and safe edit patterns.

## Goals (how an agent should act)
- Preserve behavior and CI: prefer calling existing scripts in `package.json` and running tests/lint before opening changes.
- Make minimal, reversible edits; when editing ops/bot code, prefer adding tests or a changelog entry.
- Prefer safe, non-breaking PRs: small commits, run `npm test` and `npm run lint` locally, and add a single-line `CHANGELOG.md` entry for ops changes.

## High-level architecture (concise)
- Frontend: `sites/blackroad/` — Vite-powered SPA. Static build outputs under `sites/blackroad/dist` (served by GitHub Pages or the site deploy pipeline).
- Backend API: `srv/blackroad-api/` — Express server (entry `srv/blackroad-api/server_full.js`) using SQLite (better-sqlite3) and Socket.IO.
- Chat/automation scaffolding: `codex/`, `codex/tools/`, and `scripts/` — natural-language driven helpers invoked by Ops bots and CI.
- Agents: `agents/` — small Python-based agents and experiments. Follow PEP8 and existing docstrings.
- Local/full-stack test harness: `docker-compose.yml` defines services (redis, mongo, postgres, nginx) used for integration/local runs.

Data & control flow notes
- Content (blog) flows from `sites/blackroad/content/*` -> build -> `public/` output used by the site and static artifacts (JSON + HTML) for crawlers.
- Codex scripts translate English phrases into shelled actions (e.g., `scripts/blackroad_sync.py "Push latest to BlackRoad.io"`). Preserve natural-language mapping when changing these modules.

## Concrete developer workflows (copy-paste)

Backend quick dev
```bash
npm install
npm run dev         # starts srv/blackroad-api/server_full.js with nodemon (see package.json)
```

Frontend (site)
```bash
npm --prefix sites/blackroad install
npm --prefix sites/blackroad run dev      # local dev server
npm --prefix sites/blackroad run build    # static build
```

Tests, lint, format
```bash
npm test            # jest (tests/api_health.test.js)
npm run lint        # eslint configured for specific files
npm run format      # prettier
```

Full stack smoke (Docker)
```bash
docker compose up --build
# then check service logs and health endpoints (see docker-compose.yml)
```

Run the health script (quick check)
```bash
npm run health      # node scripts/health.js — lightweight health probe
```

Codex / chat-first helpers (examples)
```bash
python scripts/blackroad_ci.py "Push latest to BlackRoad.io"
python codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
npm run fix-anything   # runs .github/tools/codex-apply.js with .github/prompts/codex-fix-anything.md
```

Agents (python)
```bash
cd agents
python -m py_compile *.py   # quick syntax check
python auto_novel_agent.py   # example entry (see agents/AGENTS.md)
```

## Project-specific conventions & patterns
- Centralized scripts: prefer `npm run <script>` rather than running node files directly. See `package.json` for canonical commands (dev, build, health, fix-anything, dev:site).
- Lint/format precommit: repository uses `husky` and `lint-staged`. JS/TS files are auto-fixed with `eslint --fix` and `prettier -w` on commit; keep PRs small to avoid large autofixes.
- Chat-driven scripts: `codex/tools/*` and `scripts/*` map English phrases to actions. Changes should preserve phrase mappings and ideally add unit tests for new mappings.
- Blog content: create `sites/blackroad/content/blog/<slug>.md` with YAML frontmatter (title, date, tags, description). Builds produce JSON/HTML artifacts under `public/`.

## Integration points & environment variables (discoverable)
- LLM stub: 127.0.0.1:8000 — many agents expect an LLM or stub here. Check `srv/lucidia-llm/` or `srv/lucia-llm/` for a minimal stub.
- Cloudflare cache ops: tokens required for `/cache purge` and `/cache warm` flows (used by chatops). Look for `CF_API_TOKEN`, `CF_ZONE_ID` in scripts.
- Stripe: environment variables (see README sections) like `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, and price IDs are referenced by the Subscribe API.
- Remote deploy vars used by sync scripts: `DROPLET_HOST`, `WORKING_COPY_PATH`, `WORKING_COPY_SSH`, `SLACK_WEBHOOK`.

Key files to inspect when editing
- `package.json` — canonical scripts, deps, lint rules — always check when adding scripts.
- `docker-compose.yml` — service topology and healthchecks used for full-stack runs.
- `srv/blackroad-api/server_full.js` — API entrypoint; understand DB expectations and default `DB_PATH`.
- `sites/blackroad/content/` — content pipeline and blog frontmatter examples.
- `codex/tools/` and `scripts/` — chat-first orchestration helpers; preserve phrase mapping.
- `.github/prompts/codex-fix-anything.md` and `.github/tools/codex-apply.js` — automated fix path; prefer using these instead of committing large auto-refactors.

## Editing rules & safety (short contract)
- Inputs: repo files, package.json scripts, AGENTS.md guidance, user prompt.
- Outputs: small, well-tested edits; run `npm test` and `npm run lint` before proposing PRs.
- Error modes: failing tests, lint errors, or changed public APIs — stop and report exact failing commands and output.
- Success: all tests pass locally, lint/format checks green, and small PR with clear commit message and CHANGELOG entry for infra changes.

Edge cases to watch for
- Missing `.env` or DB files (scripts often generate `.env` from `.env.example` but do not overwrite existing files).
- LLM stub not running on 127.0.0.1:8000 — agents may fail; use `srv/lucidia-llm/` stub if needed.
- Large auto-format changes — prefer to separate formatting-only commits from functional changes.

## Troubleshooting & quick fixes
- If builds fail after your edit:
  1. Run `npm test` and `npm run lint` locally and copy error output into the PR description.
  2. If frontend-only, run `npm --prefix sites/blackroad run build` to reproduce.
  3. For API issues, run `npm run dev` and `npm run health` to locate failures.

### Running a local LLM stub (if missing)
One of the helper bundles contains a minimal FastAPI/echo stub under `srv/lucidia-llm/`. Launch it when agents expect LLM on :8000.

## PR & CI notes
- Keep PRs small and focused. For ops/bot changes add a one-line `CHANGELOG.md` entry and update `AGENTS.md` where appropriate.
- Use `npm run fix-anything` to let the codex apply helper propose fixes; inspect results before merging.

## Where to extend docs
- If you add commands or change behavior: update `AGENTS.md` (root or under `sites/blackroad/`) and add brief usage examples in `README.md`.

---
If you'd like, I can expand any of the sections above into a short diagram, include sample PR templates, or run `npm test` and `npm run lint` now and attach the outputs. Tell me which section to expand next.
