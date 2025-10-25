# Prism Console Web

Next.js 14 App Router experience for operations leads. Surfaces mobile dashboard data, agent roster, and runbooks.

## Getting Started

```bash
pnpm install
pnpm --filter prism-console-web dev
```

Visit `http://localhost:3000` to explore the overview, agents, runbooks, and settings pages.

### Environment

Copy `.env.example` to `.env.local` and adjust as needed. For local mocks set `BLACKROAD_API_URL=http://localhost:5052/api/mobile/dashboard`.

### Quality Gates

```bash
pnpm --filter prism-console-web lint
pnpm --filter prism-console-web test
pnpm --filter prism-console-web e2e
pnpm --filter prism-console-web build
```

- Linting uses Next.js ESLint preset.
- Unit + contract tests run via Vitest.
- E2E coverage via Playwright hitting the mocked API.

### Storybook

```bash
pnpm --filter prism-console-web storybook
```

Stories live under `storybook/stories`.

### Mock API

Run a contract-identical mock with:

```bash
node mocks/server.cjs
```

### Release

1. `pnpm --filter prism-console-web build`
2. Capture Playwright report artifacts.
3. Tag `v0.1.0-prism-console` on merge.
Prism Console Web is the browser-based cockpit for the BlackRoad Prism ecosystem. It mirrors the metrics and runbook shortcuts available in the mobile experience and exposes a fast path to orchestrating agents, inspecting health, and validating compliance.

## Getting started

```bash
cd apps/prism-console-web
pnpm install --ignore-workspace
pnpm dev
```

The app runs on [http://localhost:3000](http://localhost:3000) by default.

> **Note:** The wider monorepo contains legacy npm projects that are not yet pnpm-compatible. Running the commands from inside `apps/prism-console-web` with `--ignore-workspace` keeps installation scoped to the web console only.

### Environment variables

Copy `.env.example` to `.env.local` and update values to point at your BlackRoad control plane:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `BLACKROAD_API_URL` | Base URL for the BlackRoad API gateway. |
| `BLACKROAD_API_TOKEN` | Auth token for secured requests. |

If the variables are omitted the console automatically falls back to the stubbed data located in [`mocks/`](./mocks/).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm --dir apps/prism-console-web dev` | Start the development server with hot reload. |
| `pnpm --dir apps/prism-console-web build` | Build the production bundle. |
| `pnpm --dir apps/prism-console-web start` | Start a production build. |
| `pnpm --dir apps/prism-console-web lint` | Run lint checks via Next.js. |
| `pnpm --dir apps/prism-console-web test` | Run component tests with Vitest and Testing Library. |
| `pnpm --dir apps/prism-console-web test:e2e` | Execute Playwright end-to-end tests. |
| `pnpm --dir apps/prism-console-web storybook` | Launch Storybook for component development. |

## Testing & QA

- Component tests use [Vitest](https://vitest.dev) with Testing Library.
- E2E flows use [Playwright](https://playwright.dev).
- CI runs linting, type-checking, unit tests, and `pnpm build`.

## Project structure

```
apps/prism-console-web/
├── app/               # Next.js App Router routes & layouts
├── components/        # Shared UI building blocks
├── hooks/             # React Query data access hooks
├── lib/               # API client and configuration helpers
├── mocks/             # Offline stub data
├── stories/           # Storybook stories
└── tests/             # Playwright specs
```

## Offline mode

When the API URL is not provided or fails, the console uses the stubbed data to keep the overview page functional. This mirrors the behaviour of the mobile dashboard to ensure consistent operator awareness even during outages.
