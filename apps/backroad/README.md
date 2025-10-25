# BackRoad Web

BackRoad Web is a metrics-free social layer designed for deep, psychologically safe conversations. The application ships in mock mode using Next.js App Router, TailwindCSS, and TanStack Query.

## Getting started

```bash
pnpm install
pnpm --filter backroad-web dev
```

Mock APIs live under `app/api` and source fixtures from `mocks/fixtures`. Environment variables are configured via `.env.example`.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server in mock mode. |
| `pnpm lint` | Run ESLint for app, components, hooks, and mocks. |
| `pnpm typecheck` | Execute TypeScript type checks. |
| `pnpm test` | Run Vitest unit suite. |
| `pnpm test:a11y` | Run axe-driven accessibility checks. |
| `pnpm e2e` | Execute Playwright end-to-end specs (requires running dev server). |
| `pnpm storybook` | Launch Storybook for component exploration. |

All commands are also available through the included `Makefile`.

## Architecture

- **App Router** under `app/` for threads, campfire rooms, compose, and settings routes.
- **Components** under `components/` share design tokens and accessibility primitives.
- **Hooks** under `hooks/` wrap TanStack Query, draft persistence, telemetry, and rate limits.
- **Lib** under `lib/` contains schemas, API helpers, markdown renderer, and heuristics.
- **Mocks** under `app/api` plus JSON fixtures provide offline development endpoints.

## Testing & Quality

- Vitest + React Testing Library cover key interactions (`tests/unit`).
- `axe-core` drives accessibility regression checks (`tests/a11y`).
- Playwright specs (`tests/e2e`) outline core journeys for future automation.
- Coverage thresholds are configured in `vitest.config.ts` (70%).

## Accessibility

BackRoad Web follows WCAG 2.1 AA guidance:

- Color choices respect contrast requirements.
- Keyboard focus management uses focus-visible outlines.
- Components expose semantic roles and ARIA labels where necessary.
- Axe checks guard against regressions in composer and detail views.

## Mock Mode

`MOCK_MODE=true` surfaces the offline banner and routes all requests to local fixtures. The offline banner also activates when `navigator.onLine === false`.

## Telemetry

`useTelemetry` batches events into `localStorage` under the `events-backroad` key and flushes every 10 seconds in development. Events print to the console for observability.
