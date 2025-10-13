# API Surface

The FastAPI service exposes an OpenAPI 3.1 schema at `/openapi.json`. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create a new user and organisation (owner role). |
| POST | `/auth/login` | Obtain JWT access and refresh tokens. |
| POST | `/auth/refresh` | Refresh access token. |
| GET/POST | `/scenarios` | List and create profitability scenarios. |
| GET/PUT/DELETE | `/scenarios/{id}` | Manage individual scenarios. |
| POST | `/jobs` | Submit a new job (validates image URI, runtime, budget). |
| POST | `/jobs/{id}/stop` | Stop a running job. |
| GET | `/jobs/{id}` | Fetch job status, telemetry summary, and cost projection. |
| GET | `/jobs/{id}/telemetry` | Stream telemetry samples (`from`/`to` query params). |
| GET | `/usage/current` | Retrieve current billing period usage summary. |
| GET | `/billing/portal` | Generate Stripe customer portal link. |
| POST | `/billing/webhook` | Stripe webhook receiver with signature verification. |
| GET | `/compliance/{provider}` | Fetch compliance checklist. |
| POST | `/compliance/{provider}/ack` | Record provider acknowledgement. |

The frontend consumes generated Zod types and TanStack Query hooks derived from the OpenAPI schema (via `orval`). Rate limits default to 60 RPM per user on write endpoints using Redis-backed leaky bucket.
