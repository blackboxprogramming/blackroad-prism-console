# AI Console Integration Runbook

## Overview
The AI Console stack now combines FastAPI, Next.js, Prometheus, Grafana, Caddy, Redis, and Alertmanager into a cohesive, observable platform. This document captures the configuration, operational flows, and validation steps for the new deployment model.

```
Caddy (80) ─► Next.js UI (3000)
    │               │
    │               └─► FastAPI (/api/*, /metrics)
    │
    └─► FastAPI (8000) ─► Redis (6379)
                           │
                           └─► Prometheus (9090) ─► Grafana (3001)
                                             │
                                             └─► Alertmanager (9093) ─► Slack #dev-ops
```

## Authentication & Access Control
- JWT verification handled by `console_auth.AuthManager` with Redis-backed session persistence.
- Protected routes: `/metrics`, `/maintenance/*`, `/config/*`, `/controls/*`, `/system/status`.
- Role semantics:
  - `admin`: read/write to all resources.
  - `member`: read access everywhere, write to configuration & cache flush.
  - `guest`: read-only access to metrics and system status.
- Tokens must include `exp`, `refresh_exp`, `sub`, and `role`. Refresh tokens set `token_use=refresh`.
- Access and refresh expiry values persisted in Redis (`AI_CONSOLE_REDIS_URL`). In-memory fallback is used automatically if Redis is unavailable.
- Frontend refreshes tokens silently every 55 minutes via `/api/auth/refresh` → FastAPI `/auth/refresh`.

## API Surface
Generated Markdown lives in [`docs/API_REFERENCE.md`](./API_REFERENCE.md). Key additions:
- `GET /system/status`: returns CPU, memory, latency, uptime with health states.
- `GET|PUT /config/rate-limit`: member-writeable rate limit configuration.
- `POST /maintenance/(activate|deactivate)`: admin-only toggles.
- `POST /controls/restart`, `POST /controls/cache-flush`: operational controls.
- `POST /auth/refresh`: exchanges a valid refresh token for new credentials.

## Frontend Enhancements
- `/system/metrics` page embeds Grafana and visualizes live health data with 🟢/🟠/🔴 badges.
- Zustand store caches the latest status snapshot to minimize API chatter.
- Local storage keys: `ai-console.token` (access), `ai-console.refresh` (refresh).
- Metrics proxy routes:
  - `/api/metrics` → FastAPI `/metrics` (Prometheus format).
  - `/api/system/status` → FastAPI `/system/status` (JSON summary).
  - `/api/auth/refresh` → FastAPI `/auth/refresh`.

## Monitoring & Alerting
- Prometheus configured via [`prometheus.yml`](../prometheus.yml) with two scrape jobs: `codex-infinity` (FastAPI) and `nextjs-ui` (Next.js).
- Alert rules stored in [`alerts.yml`](../alerts.yml). High latency triggers at >3s for 5m; availability alerts fire after 2m downtime.
- Alertmanager Slack integration defined in [`alertmanager.yml`](../alertmanager.yml); Slack block-kit template documented in [`config/alerts.yml`](../config/alerts.yml).
- Grafana persists dashboards in the `grafana-data` volume. Default credentials sourced from `.env` (`GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`).

## CI/CD Pipeline
- GitHub Actions workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
  - Installs Python + Node dependencies.
  - Runs focused pytest suite (`tests/test_ai_console_auth.py`) and JavaScript tests.
  - Builds & pushes Docker images via `docker compose build/push`.
  - Performs remote redeploy using `${DO_HOST}` and `docker compose up -d`.

## Docker Compose Stack
[`docker-compose.yml`](../docker-compose.yml) now orchestrates:
- `api`: FastAPI (`docker/Dockerfile.api`).
- `frontend`: Next.js UI (`docker/Dockerfile.frontend`).
- `redis`, `prometheus`, `alertmanager`, `grafana`, `caddy` supporting services.
- Shared volumes: `grafana-data`, `redis-data`.

### Environment Variables
Update `.env` or secrets manager with:
- `AI_CONSOLE_JWT_SECRET`, `AI_CONSOLE_JWT_ISSUER`, `AI_CONSOLE_JWT_AUDIENCE`.
- `AI_CONSOLE_ACCESS_TTL_MINUTES`, `AI_CONSOLE_REFRESH_TTL_MINUTES`.
- `AI_CONSOLE_REDIS_URL` (defaults to `redis://redis:6379/0` in Compose).
- `NEXT_PUBLIC_GRAFANA_URL` / `NEXT_PUBLIC_GRAFANA_PANEL_URL` for embeds.
- `SLACK_WEBHOOK_URL`, `GRAFANA_ADMIN_*`, `DO_HOST` for CI/CD.

## Verification Checklist
1. `docker compose up -d` brings all containers to healthy state.
2. `curl -f http://localhost:8000/health` succeeds without auth.
3. `curl -H "Authorization: Bearer <token>" http://localhost:8000/metrics` returns Prometheus metrics; unauthenticated call returns 401.
4. Grafana available at `http://localhost:3001` with Prometheus data source.
5. Trigger synthetic alert (`up==0`) and confirm Slack message renders using template from `config/alerts.yml`.
6. Frontend `/system/metrics` shows live badges and Grafana iframe.

## Testing Strategy
- Unit tests: `tests/test_ai_console_auth.py` covers health/public access, protected routes, role enforcement, and refresh workflow.
- CI integration: pipeline executes the test suite automatically before building images.
- Manual smoke test: run the verification checklist after deploying to staging/production.

## Operations Notes
- Session store fallback is logged at WARN level if Redis is unavailable; inspect service logs for `ai_console.auth` logger entries.
- Token replay prevention: sessions recorded with SHA-256 token hashes (`console_auth.AuthManager`). Redis keys expire at `refresh_exp` to avoid stale sessions.
- Modify alert thresholds in [`alerts.yml`](../alerts.yml) and commit; Prometheus reload endpoint (`/-/reload`) enabled for hot updates.
- For additional Slack formatting, extend the block kit template in [`config/alerts.yml`](../config/alerts.yml) and reference via Alertmanager `slack_configs`.

## Appendices
- **Systemd service**: Deploy hosts should use `/etc/systemd/system/codex-infinity.service` (sample in prompt) to supervise Docker Compose.
- **API docs**: Regenerate by running `python scripts/generate_api_reference.py` after modifying FastAPI routes.
