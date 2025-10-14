# Autopal Controls API

This mini FastAPI application models the Autopal control surfaces that power
maintenance, step-up authentication, dual-control overrides, and rate limiting.

## Features

* **Maintenance switch** – `/maintenance/activate` and `/maintenance/deactivate`
  toggle a global flag. A middleware blocks all non-allowlisted routes whenever
  maintenance mode is active, while `/health/*` remains reachable.
* **Step-up enforcement** – `/secrets/materialize` demands an `X-Step-Up`
  header with the value `verified` and otherwise responds with
  `401 step_up_required`.
* **Dual-control overrides** – `/controls/overrides` creates an override and
  `/controls/overrides/{id}/approve` requires two distinct subjects before the
  request is marked as granted.
* **Rate limiting** – `/config/rate-limit` tunes the per-identity limiter that
  guards `/limited/ping`, making it easy to exercise rate limit behaviour in
  tests.

## Running the suite

```bash
pip install -r requirements.txt
pytest autopal_fastapi/tests
```

## Local observability stack

The repository includes a docker-compose environment that launches the FastAPI
service alongside Loki, Promtail, and Grafana. Bring everything up with:

```bash
cd autopal_fastapi
docker compose up --build
```

The stack exposes the following endpoints:

* **API** – http://localhost:8080
* **Grafana** – http://localhost:3000 (admin / admin)
* **Loki** – http://localhost:3100

Promtail scrapes the Docker logs produced by the `autopal` container, parses the
structured audit fields (event, endpoint, status code, subject, trace ID), and
ships them to Loki. Grafana is pre-provisioned with the "AutoPal – Audit & Ops"
dashboard that visualises:

* A live audit log stream with JSON fields expanded for quick filtering.
* 1-hour counters for maintenance blocks, step-up prompts, and rate-limit hits.
* A dedicated panel that highlights events carrying a `trace_id`, making it easy
  to correlate requests with distributed traces.

Hit the API a few times (trigger maintenance mode, step-up prompts, and the
rate limiter) to watch the panels update in real time.
