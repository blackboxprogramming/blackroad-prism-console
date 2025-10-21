# Security & Compliance Notes

## Threat Model Highlights

- **Data plane** – API handles org membership, scenario data, telemetry, and billing metadata. Secrets (cloud credentials, Stripe keys) are encrypted at rest with AWS KMS and never logged.
- **Control plane** – IAM roles use OIDC trust with external id to prevent confused-deputy issues. Task roles limited to CloudWatch logs/metrics.
- **Tenant isolation** – All database tables include `org_id` foreign keys; request context enforces RBAC (owner, admin, member). Audit log records admin actions.

## Hardening Controls

- Argon2id password hashes with per-user salt and pepper stored in AWS Secrets Manager.
- JWT access tokens expire after 15 minutes; refresh tokens rotated with reuse detection.
- Redis keyspace prefix per-org for rate limiting and job quota tracking.
- Allowlist regex enforced on container image URIs; only outbound networking permitted.
- Budget caps verified before launch and re-checked every minute by watchdog Lambda.
- Sidecar strips environment variables and secrets from telemetry payloads.

## Incident Response

- CloudWatch alarms on unusual job start volume, repeated budget cap hits, or telemetry agent failures.
- Manual override API for security to stop all jobs in an org and revoke refresh tokens.
- Runbooks stored in `docs/mining_ops_lab/runbooks/` (to be populated) describing teardown, credential rotation, and data export.
