# Stripe Paid → Provision

Purpose: Enable product access after payment.
Triggers: Stripe `invoice.paid`.
Preconditions: Flags & Product API reachable; customer email valid.

## Steps

1. Validate invoice event.
2. Enable LaunchDarkly onboarding flag.
3. POST to Product API `/tenants`.
4. Trigger Customer.io campaign.
5. Announce in Slack `#announcements`.

## Rollback

Disable flag, delete tenant, notify finance, capture in Splunk.

## KPIs

Activation latency, success rate, DLQ volume.

## Evidence

Splunk index `audit_revenue`, bundle under `evidence/<ts>_stripe_paid_to_provision/`.
