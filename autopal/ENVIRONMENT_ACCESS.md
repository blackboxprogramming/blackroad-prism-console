# Environment Access Request Examples

This document provides examples of using the environment access request endpoints.

## Overview

The environment access request system provides a dual-approval workflow for requesting and granting access to remote environments (e.g., production, staging). Key features:

- **Dual approval required**: A different operator must approve the request
- **Time-bound access**: Access automatically expires after the specified duration
- **Audit trail**: All requests, approvals, and access grants are tracked
- **Purpose tracking**: Each request must include a purpose/reason

## Basic Workflow

### 1. Request Access

An operator requests access to a remote environment:

```bash
curl -X POST http://localhost:8080/environments/request \
  -H 'Content-Type: application/json' \
  -d '{
    "environment_name": "production",
    "requested_by": "alice",
    "purpose": "Deploy hotfix for payment processing bug",
    "duration_minutes": 120,
    "metadata": {
      "ticket": "INC-1234",
      "change_id": "CHG-5678"
    }
  }'
```

Response:
```json
{
  "request_id": "b3f454e1-e139-46da-afb0-1c630b8a61ed",
  "environment_name": "production",
  "requested_by": "alice",
  "purpose": "Deploy hotfix for payment processing bug",
  "duration_minutes": 120,
  "approved_by": null,
  "granted_at": null,
  "expires_at": null
}
```

### 2. Approve Access

A different operator approves the request:

```bash
curl -X POST http://localhost:8080/environments/b3f454e1-e139-46da-afb0-1c630b8a61ed/approve \
  -H 'Content-Type: application/json' \
  -d '{
    "approved_by": "bob"
  }'
```

Response:
```json
{
  "request_id": "b3f454e1-e139-46da-afb0-1c630b8a61ed",
  "environment_name": "production",
  "requested_by": "alice",
  "purpose": "Deploy hotfix for payment processing bug",
  "duration_minutes": 120,
  "approved_by": "bob",
  "granted_at": 1759726452.2245908,
  "expires_at": 1759733652.2245908
}
```

### 3. Check Status

Check the status of an access request:

```bash
curl http://localhost:8080/environments/b3f454e1-e139-46da-afb0-1c630b8a61ed
```

## Security Controls

### Self-Approval Prevention

The system prevents operators from approving their own requests:

```bash
# This will fail with "Approver must differ from requester"
curl -X POST http://localhost:8080/environments/<request-id>/approve \
  -H 'Content-Type: application/json' \
  -d '{
    "approved_by": "alice"  # Same as requester
  }'
```

### Double-Approval Prevention

Once approved, a request cannot be approved again:

```bash
# This will fail with "Request already approved"
curl -X POST http://localhost:8080/environments/<request-id>/approve \
  -H 'Content-Type: application/json' \
  -d '{
    "approved_by": "charlie"
  }'
```

### Request Expiration

Requests that are not approved within the timeout period (default: 15 minutes) will expire and cannot be approved.

## Configuration

The environment access endpoints can be configured in `autopal.config.json`:

```json
{
  "dual_control_timeout_seconds": 900,
  "endpoints": {
    "/environments/request": {
      "required_audience": ["internal:operators"],
      "step_up_required": false,
      "dual_control_required": false,
      "rate_limit": {
        "limit": 10,
        "window_seconds": 60
      }
    },
    "/environments/approve": {
      "required_audience": ["internal:operators"],
      "step_up_required": true,
      "dual_control_required": false
    }
  }
}
```

## Use Cases

### Emergency Production Access

```bash
# Operator requests emergency access
curl -X POST http://localhost:8080/environments/request \
  -H 'Content-Type: application/json' \
  -d '{
    "environment_name": "production",
    "requested_by": "oncall-engineer",
    "purpose": "Emergency response to P0 incident",
    "duration_minutes": 60,
    "metadata": {
      "incident": "INC-9999",
      "severity": "P0"
    }
  }'

# Manager approves
curl -X POST http://localhost:8080/environments/<request-id>/approve \
  -H 'Content-Type: application/json' \
  -d '{"approved_by": "manager"}'
```

### Scheduled Deployment

```bash
# DevOps requests access for scheduled deployment
curl -X POST http://localhost:8080/environments/request \
  -H 'Content-Type: application/json' \
  -d '{
    "environment_name": "production",
    "requested_by": "devops-alice",
    "purpose": "Scheduled deployment - Release v2.5.0",
    "duration_minutes": 180,
    "metadata": {
      "release": "v2.5.0",
      "change_window": "2025-10-07 02:00-05:00 UTC"
    }
  }'
```

## Testing

Run the unit tests:
```bash
cd autopal
python3 test_environment.py
```

Run the integration tests:
```bash
cd autopal
./test_integration.sh
```
