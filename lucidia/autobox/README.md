# Lucidia Auto-Box (TTF-01)

This folder contains the first working slice of Codex 1 — Auto-Box.

- `apps/web`: Next.js client that lets users paste notes, request a transparent classification preview, toggle suggestions, and export/purge results.
- `apps/api`: Express API stub exposing `/classify`, enforcing explicit consent and returning explainable suggestions.
- `packages/core`: Shared data contracts, validators, and export helpers.
- `packages/ai`: Deterministic classifier prototype with rationale strings and minimal features.
- `docs`: Living references for codices, security posture, and privacy promises.
- `infra`: Placeholder for deployment scripts and feature flags (crypto agility lands here).

## Getting Started

```bash
pnpm install
pnpm --filter lucidia-autobox-api dev # API on http://localhost:4000
pnpm --filter lucidia-autobox-web dev # Web client on http://localhost:3000
```

Set `NEXT_PUBLIC_API_BASE_URL` if your API listens on a different origin.

