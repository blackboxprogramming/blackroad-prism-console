# Multi-Tenancy & RBAC
- Org resolution: `orgResolver` reads `x-br-org` or session → sets `req.org.id`.
- Tenant isolation: partner/admin routes require `requireOrg()`.
- RBAC: `requireRole('admin')` gates privileged operations (owner|admin|member|viewer).
- Invites: POST `/api/orgs/invite` → email token → POST `/api/orgs/accept-invite`.
- Per-org API keys: `/api/admin/org/keys/*` bind keys to `orgId` and appear in rate limit buckets.
- Audit logs: JSONL under `data/audit/<orgId>.jsonl`, viewer in Backoffice.
