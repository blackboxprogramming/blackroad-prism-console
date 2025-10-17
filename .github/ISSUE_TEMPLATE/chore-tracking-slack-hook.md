---
name: "chore: tracking + Slack hook"
about: "Add analytics coverage and Slack loop summaries"
title: "chore: tracking + Slack hook"
labels: ["type/chore", "status/planned"]
assignees: []
---

## Problem
No visibility on key loop events.

## Solution
Emit analytics events for onboarding, upload, and payout milestones. Post a summary to `#cadillac-loop` via the existing webhook.

## Notes
- Reuse the copy defined in `docs/prism/SlackPosts_v0_1.md`.
- Coordinate with analytics to ensure event naming conventions stay consistent.
- Capture retries or failures for the Slack notifier.
