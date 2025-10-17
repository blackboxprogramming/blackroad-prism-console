# Autopal Console Service

This directory contains a FastAPI reference implementation for a secrets materialization
workflow with audience validation, step-up enforcement, per-endpoint rate limiting, and a
dual-control approval flow. It also supports environment access requests with dual approval.

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

### Secrets workflow

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

### Environment access workflow

Request access to a remote environment:

```bash
curl -X POST localhost:8080/environments/request \
  -H 'Content-Type: application/json' \
  -d '{
    "environment_name": "production",
    "requested_by": "alice",
    "purpose": "Deploy hotfix for critical bug",
    "duration_minutes": 120
  }'
```

Approve the environment access request (requires different approver):

```bash
curl -X POST localhost:8080/environments/<request-id>/approve \
  -H 'Content-Type: application/json' \
  -d '{"approved_by": "bob"}'
```

Check the status of an environment access request:

```bash
curl localhost:8080/environments/<request-id>
```
