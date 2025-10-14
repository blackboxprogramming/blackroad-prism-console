# Billing Model

## Plans

| Plan | Monthly Price | Scenarios | Concurrent Jobs | Daily Job Minutes | CSV Export | Webhook Alerts |
|------|---------------|-----------|-----------------|-------------------|------------|----------------|
| Free | $0            | 2         | 1               | 60                | No         | No             |
| Pro  | $129          | 20        | 4               | 600               | Yes        | Yes            |

Add-on: **ExtraMinutes** metered usage billed per additional job-minute beyond plan quota.

## Stripe Integration

- `Free` users onboarded via customer portal with $0 invoice.
- `Pro` uses recurring subscription item plus metered usage item for ExtraMinutes.
- Usage records posted every 5 minutes with the aggregate job-minutes since last sync.
- Webhooks handled: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`, `usage_record.summary`.
- Webhook signatures verified using Stripe's signing secret; idempotency keys stored per event id.

## Limit Enforcement

- API middleware checks plan entitlements before scenario/job creation.
- Scheduler respects concurrent job limits via Redis semaphores.
- Job runtime budget tracked per-org with redis key TTL matching runtime cap.
- When quotas exceeded, API returns HTTP 402 with upgrade URL from Stripe billing portal.
