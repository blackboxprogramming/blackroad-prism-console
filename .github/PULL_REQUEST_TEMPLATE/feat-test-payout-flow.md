---
name: "💸 feat: test payout flow"
about: "Integrates Stripe test payouts and Slack confirmation for Cadillac Loop."
title: "💸 feat: test payout flow"
labels:
  - "type/feature"
  - "prio/normal"
---

## Summary
- Enable Stripe test mode payouts when creator balance reaches $5
- Send a “First Payout” Slack message to `#cadillac-loop` on success
- Document usage of the `STRIPE_TEST_KEY` secret for local and staging validation

## Testing
- [ ] Fund a creator balance to ≥ $5 and trigger payout
- [ ] Verify Stripe test payment completes successfully
- [ ] Confirm Slack receives the “First Payout” notification

## Linked Issues
Closes #3
