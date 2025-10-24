# RFC 0006 — Public API Scope and Policies

- Status: Draft (Targeting GA Q1 FY26)
- Author: Platform DX
- Reviewers: Control Plane, Media Platform, Tokenomics
- Created: 2025-02-11

## Summary

This RFC defines the scope, resource model, and governance policies for the BlackRoad Public API (v2). The surface is contract-first, with OpenAPI 3.1 and GraphQL schemas serving as the source of truth for SDK generation, compatibility enforcement, and downstream documentation.

## Goals

1. Deliver a stable, versioned external API for Deploy/Release, Media Captioning, and Simulation Evidence.
2. Establish auth policies for OAuth 2.1 + PKCE, service tokens, and personal access tokens.
3. Guarantee idempotency, rate limits, and audit logging for every mutating operation.
4. Provide a sandbox and onboarding experience that mirrors production, including developer keys and example tooling.

## Non-Goals

- Exposing internal admin-only actions (e.g., direct DB snapshots, feature flag toggles).
- Implementing billing or monetization – handled by the existing entitlement service.
- Backporting legacy v1 endpoints.

## Resources and Verbs

| Resource | Path | Methods | Description |
|----------|------|---------|-------------|
| Deploys | `/v1/deploys` | `POST` | Create a deploy artifact against Control Plane |
| Releases | `/v1/releases/{id}:promote` | `POST` | Promote release to target environment |
| Caption Jobs | `/v1/captions` | `POST`, `GET` | Orchestrate caption jobs and retrieve results |
| Simulation Jobs | `/v1/simulations` | `POST`, `GET` | Execute Tokenomics scenarios and fetch evidence |
| Webhook Test | `/v1/webhooks/test-delivery` | `POST` | Fire signed webhook payloads into customer sandbox |

## AuthN/AuthZ Matrix

| Actor | Flow | Credentials | Scopes |
|-------|------|-------------|--------|
| OAuth App | OAuth 2.1 (PKCE) | Authorization Code | `read:*`, `deploy:write`, `media:write`, `sim:write` |
| Server-to-Server | Service Token | Signed JWT | Same as OAuth app |
| Developer | Personal Access Token | HMAC signed secret | `read:*`, optional write scopes |

### Token Claims

- `iss`: `https://auth.blackroad.io`
- `aud`: `blackroad-public-api`
- `sub`: actor identifier (user id, client id, or service id)
- `scope`: space separated list of scopes
- `exp`: 1 hour for OAuth tokens, 24h for service tokens

## Idempotency

- All `POST` endpoints require `Idempotency-Key` headers.
- Keys are stored for 24 hours in Redis with the response payload and status.
- Retries with matching payloads return the stored response; mismatched payloads return `409`.

## Rate Limits

- Default quota: 120 requests/minute per token.
- Burstable credits tracked in DynamoDB with token-bucket algorithm.
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Auditing and Observability

- Mutations emit `AuditEvent` records with actor, subject, action, correlation id.
- All requests produce OTel spans with attributes `blackroad.scope`, `blackroad.idempotency.hit`, and `blackroad.rate_limit.remaining`.
- Dashboards shipped in Grafana folder `Public API`.

## Change Management

- Any change to the REST or GraphQL contract must update `/docs/api/public/openapi.yaml` or `/docs/api/public/graphql.public.graphql`.
- Breaking changes require a major version and update to `/docs/api/public/compat.yml`.
- CI job `public-api-ci.yml` fails when rules are violated.

## Rollout

1. Launch sandbox environment with limited quota and sample data.
2. Dogfood with internal integrators.
3. Publish SDKs and docs to developer portal.
4. Enable production traffic via feature flag `public_api.enabled`.

