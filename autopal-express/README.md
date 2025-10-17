# Autopal Express

Autopal Express mirrors the operational guardrails from the FastAPI reference implementation using Node.js and Express. It provides:

- OIDC-backed authentication with JWKS discovery
- Global kill switch and configuration reload endpoint
- Redis-backed rate limiting (with automatic in-memory fallback)
- Dual-control step-up approvals and break-glass bypass token
- JSON formatted audit log suitable for ingestion into a SIEM

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

The service listens on port `8080` by default. Override the port and other runtime values via `.env` or environment variables.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port. Defaults to `8080`. |
| `AUTOPAL_CONFIG_PATH` | Path to the JSON configuration file (defaults to `./autopal.config.json`). |
| `AUTOPAL_DISABLE_ALL` | When `true`, toggles the global switch off and blocks privileged endpoints. |
| `AUTOPAL_BREAK_GLASS_SECRET` | HS256 secret for validating `X-Break-Glass` tokens. |
| `AUTOPAL_STEP_UP_HEADER` | Header checked for step-up approvals (default `X-Step-Up-Approved`). |
| `AUTOPAL_APPROVER_HEADER` | Header carrying the dual-control approver identity (default `X-Dual-Control-Approver`). |
| `AUTOPAL_AUDIT_LOG_PATH` | File used for JSON audit logs. |
| `AUTOPAL_JWKS_CACHE_TTL` | JWKS cache TTL in seconds. |
| `REDIS_URL` | Optional Redis connection string for distributed rate limits. |

### API Endpoints

- `GET /health/live` – liveness probe.
- `GET /health/ready` – readiness probe.
- `POST /secrets/materialize` – protected secret materialization flow requiring bearer token, approved step-up headers, and dual-control metadata.
- `POST /admin/reload` – reloads `autopal.config.json` and clears JWKS cache.

### Auditing

All request completions, authentication failures, break-glass events, and privileged actions are written as JSON lines to the configured audit log. The default location is `./logs/audit.log`.

### Rate Limiting

If `REDIS_URL` is provided the service uses `rate-limiter-flexible` with Redis for cross-instance throttling. Otherwise, the limiter falls back to an in-memory store.
