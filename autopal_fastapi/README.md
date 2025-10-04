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
