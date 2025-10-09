
# BlackRoad Prism Console — Copilot Agent Guide

This project is a multi-service AI platform with quantum, web, and agent orchestration. AI agents must read across directories to understand the architecture and workflows.

## Architecture & Service Boundaries
- **Express API** (`srv/blackroad-api/server_full.js`): Port 4000, SQLite, Socket.IO, cookie-session auth, Stripe billing, LLM bridge.
- **LLM Service** (`srv/lucidia-llm/app.py`): FastAPI stub on port 8000. Health at `/health`, chat at `/chat`. Replace stub for real LLMs.
- **Frontend SPA**: `/var/www/blackroad/index.html` (served via NGINX).
- **Service Discovery**: API auto-detects its path; see `ops/install.sh` for setup logic.
- **Agents & Orchestrator**: Athena (`athena_orchestrator.py`) manages agent tasks/status in `AGENT_WORKBOARD.md`.

## Developer Workflows
- **Setup**: Run `ops/install.sh` to scan for missing deps, create `.env`, and bootstrap API/LLM.
- **Local Dev**: Use `npm run dev` (API), `npm run frontend:dev` (SPA), or `make dev` (see `Makefile`).
- **Testing**: Jest for Node, Pytest for Python. Run `npm test`, `make test`, or `pytest`.
- **Dependency Scan**: `node tools/dep-scan.js --dir <api> --save` auto-installs missing npm packages.
- **CI/CD**: `.github/workflows/ci.yml` runs format, lint, tests, and contract validation. See `scripts/blackroad_sync.py` for chat-driven deploys.

## Project Conventions
- **Config**: All secrets/envs in `.env` (see `ops/install.sh` for auto-generation). Required: `SESSION_SECRET`, `INTERNAL_TOKEN`. Optional: `DB_PATH`, `LLM_URL`, `ALLOW_SHELL`, `BILLING_DISABLE`.
- **Formatting**: Prettier, ESLint, `.editorconfig` (UTF-8, LF, 2-space indents). See `CLEANUP_DECISIONS.md` for policy.
- **Security**: Helmet, rate-limit, CORS allowlist (`ALLOW_ORIGINS`), cookie-session flags. Input validation via `express-validator`.
- **Trash Policy**: Dead files moved to `/_trash/` with README. See `CLEANUP_DECISIONS.md`.

## Integration & Extension
- **LLM Bridge**: API proxies `/api/llm/chat` to `LLM_URL`. Fallback stub in `srv/lucidia-llm/test_app.py`.
- **Billing**: Stripe integration via env vars. Webhooks at `/api/billing/webhook`.
- **Connectors**: Status at `/api/connectors/status`. See `INTEGRATIONS_SECURITY.md` for secure integration patterns (Slack, Asana, GitHub, Discord, Airtable).
- **Agents**: Add new agents in `agents/` or extend Athena. See `AGENTS.md` for agent guidelines and workboard conventions.

## Key Files & Examples
- `srv/blackroad-api/server_full.js`: Main API, routes, middleware, billing, LLM bridge.
- `srv/lucidia-llm/app.py`: LLM stub, health, chat endpoint.
- `ops/install.sh`: Setup logic, env generation, dependency scan.
- `Makefile`: Common dev/test/build targets.
- `AGENT_WORKBOARD.md`: Agent task/status board.
- `athena_orchestrator.py`: Agent orchestration logic.
- `CLEANUP_DECISIONS.md`: Formatting, linting, security, trash, and CI policies.
- `INTEGRATIONS_SECURITY.md`: Secure integration playbook for external services.

## Agent Patterns & Safety
- Agents should update the workboard (`AGENT_WORKBOARD.md`) and follow Athena’s orchestration (`athena_orchestrator.py`).
- All code changes must pass CI checks and follow formatting/linting rules.
- Never commit secrets or credentials; use env vars and secret managers.
- For new routes, use validation middleware and follow session-based auth patterns.

## Example: Add a New Agent
1. Create agent in `agents/` or extend Athena.
2. Register tasks in `AGENT_WORKBOARD.md`.
3. Ensure agent follows orchestration and notification patterns.
4. Test agent logic and integration before PR.

---
Scripts and helpers are defensive: they merge configs and never overwrite existing files. Always review changes for security and compliance.