<!-- Short, copyable PR template for contributors and automated agents -->

# Pull Request

## Summary

Provide a short (1-2 line) summary of the change.

## Changes

- Files changed (bullet list):
- Why these changes were made:

## Checklist (required for PRs created by automation)

- [ ] Lint: `npm run lint` (document any auto-fixes)
- [ ] Tests: `npm test` (list failing tests if any)
- [ ] Dependency hygiene: if you added new imports, run `node tools/dep-scan.js --dir <package> --save` (commit only the tool output)
- [ ] Env vars: added/changed? If yes, update `srv/blackroad-api/.env.example` and document defaults
- [ ] Ports/compose changes? If yes, update `ops/install.sh` and `docker-compose*.yml`
- [ ] Secrets: no secrets in the diff

## Commands I ran locally

```
# Bootstrapped repo
bash ops/install.sh

# If touching server package (example):
node tools/dep-scan.js --dir srv/blackroad-api --save

# Tests & lint
npm test
npm run lint

# Quick runtime/health check
npm run health
bash tools/verify-runtime.sh
```

## Notes for reviewers

- Any non-obvious decisions or trade-offs
- If the change touches webhooks or payments (Stripe), validate signature handling and replay payloads in staging
<!--
PULL REQUEST TEMPLATE — BlackRoad Prism Console
Copy this checklist into your PR description and fill it out before requesting review.
-->

Short summary (1-2 lines):

Files changed and why (1-3 bullets):

---

Local commands I ran (copyable):

```bash
# Install / verify deps (run from repo root)
bash ops/install.sh

# In API: run tests and lint
cd srv/blackroad-api && npm test && npm run lint

# Start API (dev)
cd srv/blackroad-api && npm run dev

# Start frontend (dev)
npm run dev:site

# Optional: quick runtime verify
npm run health && bash tools/verify-runtime.sh
```

Env vars added? (yes/no):

If yes, update `srv/blackroad-api/.env.example` with names and defaults (brief description):

Ports/compose changes? (yes/no):

If yes, list changed files:

Security & secrets checklist:

- Did you avoid committing secrets? (yes/no)
- If credentials were required for local testing, were they set via env only? (yes/no)

Notes for reviewers / special instructions:

# Summary

What does this change?

# Testing

- Local build passes
- `npm run build` (site) / API boots
- E2E (Playwright) green

# Checklist

- Docs/README updated if needed
- No secrets committed
- Labels added (area/site, area/api, etc.)
