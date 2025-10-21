# Stripe Webhook + Seeder Rollout Notes

## Asana Drops

```
Task Name,Description,Assignee Email,Section,Due Date
Stripe webhook verifier,Add /webhooks/stripe with signature verification + upserts.,amundsonalexa@gmail.com,Today,2025-10-22
SSM: webhook secret,Store /blackroad/<env>/stripe/webhook_secret.,amundsonalexa@gmail.com,Today,2025-10-22
Seed test data,Run stripe-seed (test mode) to create product/prices/customers/subs/charges.,amundsonalexa@gmail.com,Today,2025-10-22
End-to-end smoke,Confirm webhook inserts + tiles update; screenshot for Friday demo.,amundsonalexa@gmail.com,Today,2025-10-22
```

## Slack Blurbs

### #products-prism

Stripe wired end-to-end:
- Verified webhook handler (charge/subscription/invoice)
- Test-mode seeder creates product/prices/customers/subs/charges
- Tiles show $$ immediately after seed

If tiles don’t move, check #security for the webhook secret and raw-body parser.

### #security

Stripe webhook secret stored in SSM; verification enforced.
Only test-mode keys used for seed. Production will use restricted read-only keys.
