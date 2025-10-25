# RoadWork Scaffold Plan

## Task List
1. Establish project structure under `apps/roadwork/` with initial Next.js app routing skeleton, shared config, and Tailwind setup.
2. Implement domain schemas, adaptivity logic, utilities, and hooks with accompanying unit tests.
3. Build core UI components (catalog, lesson, practice/quiz, navigation/accessibility) alongside Storybook stories and tests.
4. Wire mock API route handlers with fixtures, Zod validation, and contract tests including intentional drift failure.
5. Implement telemetry, rate limiting, persistence guard enhancements per macros with unit coverage.
6. Develop accessibility infrastructure (skip links, live regions) and axe-based accessibility tests resolving violations.
7. Add Playwright e2e tests for the three specified learning journeys with stable selectors and mock interactions.
8. Configure CI workflow, Makefile targets, documentation (README, CHANGELOG, SECURITY, A11Y, CONTENT), and ensure coverage thresholds.

## Proposed File Tree
- `apps/roadwork/`
  - `app/`
    - `layout.tsx`
    - `page.tsx`
    - `lesson/[slug]/page.tsx`
    - `lesson/[slug]/practice/page.tsx`
    - `lesson/[slug]/quiz/page.tsx`
    - `progress/page.tsx`
    - `settings/page.tsx`
  - `components/` *(lesson, practice, navigation, feedback components)*
  - `hooks/` *(React Query, adaptivity, progress, telemetry, accessibility)*
  - `lib/` *(schemas, adaptivity engine, markdown, time, rate limit)*
  - `mocks/`
    - `fixtures/`
    - `handlers.ts`
  - `styles/`
    - `globals.css`
    - `tailwind.css`
  - `tests/` *(unit, accessibility, e2e helpers)*
  - `playwright/` *(config, tests)*
  - `storybook/` *(config, stories)*
  - `README.md`
  - `CHANGELOG.md`
  - `SECURITY.md`
  - `A11Y.md`
  - `CONTENT.md`
- `docs/roadwork-openapi.yaml`
- `.github/workflows/ci.yml`
- `Makefile`

## Risk Register
- **Scope breadth**: Large surface area (UI, mocks, tests, CI) may lead to incomplete implementation; mitigate by iterating folder-by-folder per orchestration.
- **Accessibility compliance**: Ensuring WCAG AA in initial pass might miss edge cases; plan to integrate axe tests early and manually verify focus flows.
- **LocalStorage reliance**: Browser APIs unavailable in SSR can break Next.js pages; guard hooks to run client-side with hydration-safe defaults.
- **Testing load**: Running full CI suite (unit, a11y, e2e) may be time-consuming; ensure deterministic mocks and selective fixtures to keep runtime manageable.
- **Contract drift**: Maintaining fixtures and Zod schemas in sync is complex; implement shared schema definitions and dedicated failing test as requested.
