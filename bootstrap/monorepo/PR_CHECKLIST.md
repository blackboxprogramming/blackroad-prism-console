# RoadChain Monorepo PR Checklist

Use this checklist in pull requests that target the RoadChain monorepo or any derivative project.
Feel free to copy it into `.github/PULL_REQUEST_TEMPLATE.md` or link to it from your contributing
guide.

## Readiness
- [ ] Title follows the repo's conventional commit / release note expectations.
- [ ] Linked issues or product specs are referenced in the description.
- [ ] Breaking changes are called out with migration steps.

## Code Quality
- [ ] `make lint` passes (includes web + contracts linting).
- [ ] `make test` passes locally or in CI.
- [ ] All new/updated code paths have direct test coverage.
- [ ] Secrets, RPC URLs, and API keys are sourced from environment variables.

## Web (RoadWeb)
- [ ] UI renders without console errors using `npm --prefix apps/roadweb run dev`.
- [ ] Network calls point at the correct devnet or staging endpoints.
- [ ] Storybook / visual baselines are updated if affected (optional if not used).

## Contracts (RoadCoin)
- [ ] `npm --prefix packages/roadcoin run test` passes (Hardhat tests).
- [ ] `npm --prefix packages/roadcoin run test:foundry` passes (Foundry tests).
- [ ] Slither analysis is clean or findings are documented.
- [ ] Deployment scripts and configuration are updated when interfaces change.

## Documentation
- [ ] README / runbooks mention any new scripts, secrets, or infra components.
- [ ] Example `.env` files include new variables.
- [ ] Changelogs or release notes capture user-facing updates.
