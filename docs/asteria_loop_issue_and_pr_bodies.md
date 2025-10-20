# Asteria Loop Issue & PR Drafts

This reference provides ready-to-paste GitHub issue bodies and pull request templates aligned with the Asteria Loop sprint themes. Each issue uses the repository's standard tri-section structure (`Problem`, `Solution`, `Notes`), and the PR drafts follow the `Summary`, `Testing`, `Linked Issues` layout required by `.github/pull_request_template.md`.

> **Note:** The initiative previously shipped under a different codename that has now been retired. We use **Asteria** moving forward to avoid potential trademark conflicts while legal review is in progress.

---

## Issue Drafts

### 1. `feat: onboarding shell`
```
## Problem
The Asteria Loop onboarding experience lacks a guided shell that welcomes new creators and routes them through the initial checklist.

## Solution
Implement the onboarding shell with dedicated routes for the welcome screen and checklist progression, including placeholder copy and navigation guards that can be expanded later.

## Notes
- Align route names and layout with `asteria_loop_project_layouts.md`.
- Coordinate with design to confirm welcome copy blocks before final QA.
```

### 2. `feat: creator upload + gallery`
```
## Problem
Creators cannot currently upload showcase assets or view an organized gallery, blocking the demo loop.

## Solution
Deliver a file upload form with validation, persist uploaded assets, and surface them in a responsive gallery view using the Asteria Loop design system tokens.

## Notes
- Reuse existing storage helpers if available; otherwise document new ones.
- Ensure empty-state messaging covers both “no uploads yet” and “upload failed”.
```

### 3. `feat: test payout flow`
```
## Problem
The payout flow is untested, and we need confidence that the Stripe integration and balance ledger behave correctly during demos.

## Solution
Introduce a mocked Stripe client, seed representative payout scenarios, and verify balance transitions with automated tests.

## Notes
- Capture any contract updates in `docs/payments.md` if interfaces change.
- Coordinate with Finance Ops on thresholds and rounding rules.
```

### 4. `chore: tracking + Slack hook`
```
## Problem
Key Asteria Loop events are not reaching analytics or the operations Slack channel, reducing visibility during the sprint.

## Solution
Emit structured tracking events for onboarding, upload, and payout milestones, and post notifications to the designated Slack channel via the existing webhook infrastructure.

## Notes
- Include message throttling to avoid Slack spam during load tests.
- Document new event names in `docs/analytics_events.md`.
```

### 5. `meta: friday retro`
```
## Problem
We lack an automated reminder and template for the recurring Friday retro in Asana, leading to missed follow-ups.

## Solution
Automate creation of the Friday retro task with the Asteria Loop board metadata and attach the retro agenda template for quick completion.

## Notes
- Mirror the cadence rules captured in `asteria_loop_project_layouts.md`.
- Confirm Asana API tokens remain valid in the CI environment.
```

---

## Pull Request Drafts

### A. Onboarding Shell Implementation
```
## Summary
- scaffold the Asteria Loop onboarding shell with welcome and checklist routes
- add navigation guards and placeholder copy that match sprint messaging
- wire initial analytics events for entry and completion

## Testing
- npm run lint
- npm run test -- onboarding-shell
- npm run dev (manual smoke test of routes)

## Linked Issues
- Closes #<issue_number>
```

### B. Creator Upload + Gallery
```
## Summary
- deliver validated creator upload form with storage integration
- render uploaded assets in responsive gallery components
- document empty states and error messaging for the loop

## Testing
- npm run lint
- npm run test -- creator-gallery
- npm run dev (manual upload + gallery verification)

## Linked Issues
- Closes #<issue_number>
```

### C. Payout Flow Test Harness
```
## Summary
- add mocked Stripe client to exercise Asteria Loop payout logic
- seed representative ledger scenarios and assertions
- surface regression coverage in CI reporting

## Testing
- npm run lint
- npm run test -- payouts
- npm run ci:coverage

## Linked Issues
- Closes #<issue_number>
```
