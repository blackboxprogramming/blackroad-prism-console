# RoadView Web

RoadView Web is a credibility-first search interface for BlackRoad. It showcases source transparency, renders per-result
credibility signals, and enables client-side filtering, sorting, and telemetry.

## Features

- **App Router (Next.js 14) + TypeScript** scaffolded under `apps/roadview` with TailwindCSS styling
- Mocked `/api/search` endpoint backed by static fixtures and validated by Zod schemas
- React Query powered `useSearch` hook with debounced queries, localStorage persistence, and contract tests
- Rich UI components (SearchBar, ResultCard, FiltersPanel, SortSelect, SourceTransparencyPanel, CredibilityBadge) with
  Storybook stories and Vitest + Testing Library coverage
- Accessibility gates via `jest-axe` for critical components and Playwright e2e happy-path coverage
- Lightweight client telemetry buffering `search` and `filter_change` events to `localStorage` with batching semantics

## Getting started

```bash
cd apps/roadview
pnpm install
pnpm dev
```

Visit `http://localhost:3000` for the landing page and `http://localhost:3000/search?q=blackroad` to exercise the mocked
results experience.

## Available scripts

| Command              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `pnpm dev`           | Start the Next.js development server with the mock API. |
| `pnpm build`         | Create a production build.                              |
| `pnpm start`         | Serve the production build.                             |
| `pnpm lint`          | Run ESLint (Next.js configuration).                     |
| `pnpm typecheck`     | Run TypeScript in no-emit mode.                         |
| `pnpm test`          | Execute Vitest unit tests with coverage thresholds.     |
| `pnpm coverage`      | Generate coverage report.                               |
| `pnpm storybook`     | Launch Storybook locally on port 6006.                  |
| `pnpm storybook:build` | Build the Storybook static bundle.                    |
| `pnpm e2e`           | Run Playwright e2e tests (requires `pnpm dev`).         |

The included `Makefile` wraps the most common workflows.

## Testing & quality gates

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` must succeed before merging.
- Unit tests enforce Zod contract validation (missing `credScore` or out-of-range `confidence` fails fast) and
  telemetry batching behavior.
- Accessibility checks via `axe` run inside component tests for `ResultCard` and `FiltersPanel`—violations fail the
  build.
- Playwright validates the end-to-end search flow with client-side filters.
- Storybook must build without errors (`pnpm storybook:build`).

## Telemetry batching

`lib/telemetry.ts` exposes a `track` helper used by `useSearch` and filter actions. Events are stored in localStorage,
flushed in batches (max 10 events or 5 seconds), and printed to the console in development. Tests cover batch limits and
interval-based flushing, ensuring deterministic behavior.

## Environment variables

No external services are required in this mocked version. An `.env.example` file is provided with a placeholder for a
future `ROADVIEW_API_URL` should the API transition away from the built-in mocks.
