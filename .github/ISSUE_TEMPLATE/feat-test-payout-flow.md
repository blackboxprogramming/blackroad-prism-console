---
name: "feat: test payout flow"
about: "Wire Stripe test payouts and Slack notifications"
title: "feat: test payout flow"
labels: ["type/feature", "status/planned"]
assignees: []
---

## Problem
Creators can’t complete the payout loop.

## Solution
Integrate Stripe test mode and trigger a `$5` payout when the balance reaches at least 5. Emit a Slack “First Payout” message on success.

## Notes
- Use the finance test account secret `STRIPE_TEST_KEY`.
- Confirm payout receipts appear in the test dashboard.
- Align Slack messaging with Cadillac Loop copy.
