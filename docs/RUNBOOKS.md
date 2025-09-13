# Runbooks

## Deploy
- Triggered automatically on push to `main`.
- Manual: `make deploy` or `bash ops/bluegreen_deploy.sh`.

## Stripe
- Set secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs in repo variables.
- Test endpoint: `GET /api/billing/prices`
- Checkout: `POST /api/billing/checkout { priceId }`
- Webhook: `POST /api/stripe/webhook` (set secret in GitHub → ENV → server)

## Webhooks
- Register GitHub → Matomo via workflow “Register Webhook”.
- Receiver lives at `/api/hooks/github` (extend later with signature validation).

