# Prism PR Automation Quickstart

This note maps the Asteria Loop milestones to the repo's automation guardrails so the generated pull requests fit without manual fixes.

## Guardrails to satisfy

- **PR title gate** – `.github/workflows/pr-title-guard.yml` requires a conventional commit title of the form `type(scope): summary` (no leading emoji).【F:.github/workflows/pr-title-guard.yml†L1-L36】
- **UID policy** – `UID_POLICY.md` and the UID kit enforce ULID usage across branches, commit trailers, and PR titles/bodies (`feat/<UID>-summary`, `UID: <UID>`, `[<UID>] …`).【F:UID_POLICY.md†L1-L23】【F:uid-kit/README.md†L1-L43】

## Recommended wiring per PR

| Work item | ULID | Branch name | Conventional PR title | Commit message template |
| --- | --- | --- | --- | --- |
| Onboarding shell | `06CY05MC8TXM79ZA0D3YQKPX1M` | `feat/06CY05MC8TXM79ZA0D3YQKPX1M-prism-onboarding` | `feat(prism-onboarding): welcome + checklist shell` | `feat(prism-onboarding): bootstrap onboarding surfaces\n\nUID: 06CY05MC8TXM79ZA0D3YQKPX1M` |
| Creator upload + gallery | `06CY05MM1SQ899TDHHA4310CHW` | `feat/06CY05MM1SQ899TDHHA4310CHW-prism-creator-flow` | `feat(prism-creator): upload form, gallery view, mock balance` | `feat(prism-creator): wire upload + gallery flow\n\nUID: 06CY05MM1SQ899TDHHA4310CHW` |
| Stripe test payout | `06CY05MNRGSB2F6CXPMMANT65R` | `feat/06CY05MNRGSB2F6CXPMMANT65R-prism-test-payout` | `feat(prism-payouts): Stripe test-mode claim + Slack alert` | `feat(prism-payouts): enable $5 test payout loop\n\nUID: 06CY05MNRGSB2F6CXPMMANT65R` |

### Usage notes

1. **Keep emoji inside the body** – add 🚀 flair inside the PR description if desired, but leave the title clean to satisfy the guard.【F:.github/workflows/pr-title-guard.yml†L25-L36】
2. **Mirror ULID everywhere** – copy the same ULID into the PR body, issue link, and any evidence bundle so automation can join the artifacts without heuristics.【F:UID_POLICY.md†L9-L23】
3. **Trailer placement** – leave a blank line before the `UID:` trailer so the hook in `uid-kit/hooks/commit-msg` recognizes it as a footer.【F:uid-kit/README.md†L23-L43】

These conventions let the PR Title Guard pass, keep UID automation happy, and route reviewers automatically through the existing labeling workflows.
