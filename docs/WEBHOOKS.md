# Webhooks
- Register endpoints via `/api/admin/webhooks/register`.
- Deliveries are signed with HMAC SHA-256 in `x-br-sign` using `WEBHOOK_SIGNING_SECRET`.
- Retries use exponential backoff; logs in `apps/api/webhooks_log.jsonl`.
