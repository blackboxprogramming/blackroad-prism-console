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
