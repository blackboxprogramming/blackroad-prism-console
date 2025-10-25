# RoadWork

RoadWork is an adaptive learning portal built with Next.js 14, TailwindCSS, and React Query. It offers an accessible lesson → practice → adaptive quiz loop with local-first progress and mock APIs.

## Getting Started

```bash
pnpm install
pnpm --filter @blackroad/roadwork dev
```

## Scripts

- `pnpm --filter @blackroad/roadwork dev` – start the Next.js dev server.
- `pnpm --filter @blackroad/roadwork build` – create a production build.
- `pnpm --filter @blackroad/roadwork start` – run the production server.
- `pnpm --filter @blackroad/roadwork test` – run Vitest unit tests.
- `pnpm --filter @blackroad/roadwork a11y` – run axe accessibility checks.
- `pnpm --filter @blackroad/roadwork e2e` – execute Playwright tests.

## Accessibility

- Skip links, focus-visible states, and semantic landmarks for navigation.
- WCAG AA contrast via Tailwind tokens.
- Axe tests covering key layouts (catalog, lesson header, feedback components).

## Adaptivity

Quiz difficulty adjusts using a simple rule engine:

- Two fast correct answers → increase difficulty (up to level 3).
- Slow or incorrect answers → decrease difficulty (down to level 1).
- Challenge level chip displays the current difficulty.

## Progress & Privacy

- LocalStorage stores progress and quiz attempts using Zod validation.
- Corrupted data is archived under `rw-progress-corrupt-<timestamp>.json`.
- Export/import JSON from the progress page; telemetry remains local-only.

## Mock API

Next.js route handlers serve fixtures from `mocks/fixtures`. Schemas are enforced with Zod, and `schemas.spec.ts` contains a failing-drift test to guard contract changes.
