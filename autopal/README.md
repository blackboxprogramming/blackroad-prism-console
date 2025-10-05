# Autopal Console Service

This directory contains a FastAPI reference implementation for a secrets materialization
workflow with audience validation, step-up enforcement, per-endpoint rate limiting, and a
dual-control approval flow.

## Running locally

```bash
pip install -r requirements.txt
AUTOPAL_CONFIG=./autopal.config.json uvicorn app.main:app --reload --port 8080
```

## Docker

```bash
docker build -t autopal .
docker run -p 8080:8080 -e AUTOPAL_CONFIG=/app/autopal.config.json autopal
```

## Quick smoke tests

```bash
curl -i localhost:8080/health/live
curl -i -X POST localhost:8080/secrets/materialize \
  -H 'Authorization: Bearer test-token' \
  -H 'X-Audience: gha:org/repo@refs/heads/main' \
  -H 'X-Step-Up-Approved: true' \
  -H 'X-Approval-Id: <approval-id>'
```

Create the approval id first by staging and confirming a dual-control request:

```bash
curl -X POST localhost:8080/secrets/approvals/request \
  -H 'Content-Type: application/json' \
  -d '{"context": "/secrets/materialize", "requested_by": "alice"}'

curl -X POST localhost:8080/secrets/approvals/<approval-id>/approve \
  -H 'Content-Type: application/json' \
  -d '{"approved_by": "bob"}'
```
