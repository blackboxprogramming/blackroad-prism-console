---
name: "💸 feat: test payout flow"
about: "Completes the payout loop with Stripe test mode integration"
title: "💸 feat: test payout flow"
labels:
  - "type/feature"
  - "status/ready-for-review"
---

## Summary
- Completes payout loop with Stripe test mode integration and Slack alert.

## Testing
- Balance ≥ 5 → click “Claim Reward”.
- Stripe test payment executes successfully.
- Slack `#cadillac-loop` receives confirmation.

## Linked Issues
Closes #3
