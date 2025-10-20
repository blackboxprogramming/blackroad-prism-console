# Prism Asteria Loop Sprint Plan

This document drafts the pull request titles, bodies, and supporting GitHub issues for the three-part onboarding and Asteria Loop rollout described in `docs/prism-onboarding-ux.md` and the v0.1 notes.

## Pull Request Drafts

### PR-1 — Welcome + Checklist Shell
**Title:** `feat(prism-onboarding): add welcome flow and checklist shell`

**Body:**
```
## Summary
- add prism onboarding welcome hero and checklist routes under /prism/(onboarding)
- introduce top navigation stub and empty dashboard tiles aligned with onboarding UX copy
- wire checklist progress tracking and fire Complete Onboarding analytics event on completion

## Testing
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm dev (manual onboarding flow smoke test)
```

### PR-2 — Creator Upload → Gallery (Asteria Loop)
**Title:** `feat(prism-creator): enable upload-to-gallery loop`

**Body:**
```
## Summary
- add creator upload form with drag-and-drop and POST /api/v1/uploads handler
- display latest uploads with status plus balance ticker and mock payout unlock
- emit PRISM Upload Created and PRISM View Dashboard analytics events per tracking plan

## Testing
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm dev (manual upload + gallery verification)
```

### PR-3 — Test Payout (Stripe Test Mode)
**Title:** `feat(prism-creator): add $5 test payout flow`

**Body:**
```
## Summary
- add creator payout claim page with test-mode Stripe integration
- create /api/v1/payouts/test endpoint persisting payout audit trail
- send Slack first-payout notification using docs/prism/SlackPosts_v0_1.md template

## Testing
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm dev (manual payout flow smoke test)
```

## GitHub Issues

1. **Onboarding shell**
   - _Description:_ Implement the onboarding welcome page, checklist page, and top navigation shell referenced in `docs/prism-onboarding-ux.md`. Ensure the checklist tracks three steps (Create org, Connect source, View dashboard) and fires the "Complete Onboarding" analytics event when all steps are complete.
   - _Acceptance Criteria:_ Routes render under `/prism/(onboarding)`, navigation links resolve, and the progress bar persists state on refresh.

2. **Upload endpoint + form**
   - _Description:_ Build the creator upload experience, including drag-and-drop/file input UI and a temporary `/api/v1/uploads` endpoint that stores uploads and returns `{id, status: 'PUBLISHED'}`.
   - _Acceptance Criteria:_ Upload succeeds locally, analytics events emit, and errors surface in the UI.

3. **Gallery + balance ticker**
   - _Description:_ Surface the ten most recent uploads with status indicators and implement the mock balance ticker (`balance = min(0.50, views * 0.01)`). Display the "Claim $5 test payout" affordance when `balance >= 5` and link to the payout page.
   - _Acceptance Criteria:_ Gallery updates after uploads, balance increments with mocked view counts, and the payout CTA obeys the threshold.

4. **Payout test**
   - _Description:_ Implement the Stripe test-mode payout flow exposed at `/api/v1/payouts/test`, persisting each payout attempt (user_id, amount, timestamp) and rendering the claim UI.
   - _Acceptance Criteria:_ Successful test payout returns confirmation, records an audit entry, and displays completion state in the UI.

5. **Tracking & Slack hook**
   - _Description:_ Wire the analytics events (`PRISM View Dashboard`, `PRISM Upload Created`, `Complete Onboarding`) and trigger the Slack notification template on first successful payout as outlined in `docs/prism/TrackingPlan_v0_1.md` and `docs/prism/SlackPosts_v0_1.md`.
   - _Acceptance Criteria:_ Events appear in analytics pipeline mock/logs, and Slack message fires exactly once for the initial payout.
