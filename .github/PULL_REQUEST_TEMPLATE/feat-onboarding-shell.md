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
about: "Implements the Cadillac Loop onboarding welcome + checklist shell."
title: "✨ feat: onboarding shell"
labels:
  - "type/feature"
  - "prio/normal"
---

## Summary
- Implement welcome, checklist, and dashboard stub routes under `/prism/(onboarding)`
- Persist checklist progress and emit the `PRISM Checklist Completed` event
- Align copy with [`docs/prism-onboarding-ux.md`](../../docs/prism-onboarding-ux.md)

## Testing
- [ ] Run `pnpm dev` and visit `/prism`
- [ ] Verify the checklist progress bar fills as steps complete
- [ ] Confirm the `PRISM Checklist Completed` analytics event fires

## Linked Issues
Closes #1
