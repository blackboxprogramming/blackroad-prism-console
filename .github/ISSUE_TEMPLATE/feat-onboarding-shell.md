---
name: "feat: onboarding shell"
about: "Track the onboarding welcome + checklist shell implementation"
title: "feat: onboarding shell"
labels: ["type/feature", "status/planned"]
assignees: ["Lucidia"]
---

## Problem
New creators need a guided first-run: welcome screen → checklist → dashboard stub.

## Solution
Add pages under `apps/web/app/prism/(onboarding)` with progress tracking and analytics events (`PRISM Checklist Completed`).

## Notes
- Use doc copy from `prism-onboarding-ux.md`.
- Assign @Lucidia for UX review.
- Ensure analytics hooks conform to Cadillac Loop dashboards.
