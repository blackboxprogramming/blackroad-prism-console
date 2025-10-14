---
name: "✨ feat: onboarding shell"
about: "Implements the Cadillac Loop onboarding welcome + checklist flow"
title: "✨ feat: onboarding shell"
labels:
  - "type/feature"
  - "status/ready-for-review"
---

## Summary
- Implements welcome + checklist flow for Cadillac Loop v0.1.
- Routes: `/prism/(onboarding)/welcome`, `/checklist`, `/dashboard`.

## Testing
- Run `pnpm dev` → visit `/prism`.
- Verify checklist progress bar fills.
- Confirm analytics event `PRISM Checklist Completed` fires.

## Linked Issues
Closes #1
