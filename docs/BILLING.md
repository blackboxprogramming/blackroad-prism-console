# Billing
- Generate invoice: `node scripts/generate_invoice.ts` or `POST /api/invoices/create`.
- Dunning runs daily via `dunning.yml` and posts Slack notices.
- Entity name via `BILLING_FROM_ENTITY`.
