# GUARDRAILS

## File Scope Map
- Agent 1: project scaffold + brand tokens (lib/brand.ts, app/layout.tsx, app/globals.css, config files, components/Logo.tsx)
- Agent 2: components/ui/*, components/Topbar.tsx, hooks/*, lib/seo.ts, app/(dev)/ui/*
- Agent 3: app/(public)/page.tsx (Hub)
- Agent 4: app/login/page.tsx (+ util)
- Agent 5: app/cocode/page.tsx (+ local components only)
- Agent 6: app/roadview/page.tsx, app/roadcoin/page.tsx, app/roadchain/page.tsx, app/roadie/page.tsx, app/lucidia/page.tsx, app/codex/page.tsx
- Agent 7: components/Topbar.tsx (or reuse), minimal edit to app/layout.tsx to mount Topbar
- Agent 8: metadata per route, public/robots.txt, public/sitemap.xml, public/og-default.png; a11y tweaks
- Agent 9: package.json scripts, lint/prettier ignores, README.md, .github/workflows/lint.yml
- Agent 10: tests/smoke.md, scripts/health-check.js, MERGE_PLAN.md

## Merge Policy
- Auto merge PRs that only add new files.
- package.json scripts: union of unique entries; identical duplicates removed; differing duplicates keep Agent 9's value and note alternative as comment.
- tailwind.config.ts: merge unique plugins and content globs.
- app/layout.tsx: keep Agent 1 base; append Topbar import and mount from Agent 7 below existing imports and above {children}.
- app/globals.css: append new CSS variable blocks; do not modify existing tokens.
- UI components: unique filenames to avoid collisions.
- Unresolved conflicts -> create CONFLICT.md with exact hunks and suggested resolution.

## Acceptance Gates
- Build: `npm run build` passes.
- Lint: `npm run lint` passes.
- Typecheck: `npm run typecheck` passes.
- `/login` Lighthouse a11y score ≥ 90.
- `/cocode` responsive and keyboard accessible.
- Placeholder portals link back to Hub.
- Topbar visible on all pages; mobile menu keyboard navigable.
- `node scripts/health-check.js` returns 200 for `/` and `/login`.
