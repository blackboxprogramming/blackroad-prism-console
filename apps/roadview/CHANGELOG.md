# Changelog

## 0.1.0 - 2024-09-30

- Scaffolded RoadView Web (Next.js 14 + TypeScript) with TailwindCSS styling and mocked `/api/search` endpoint.
- Implemented core UI components (SearchBar, ResultCard, CredibilityBadge, FiltersPanel, SortSelect, SourceTransparencyPanel).
- Added React Query hooks with Zod contract validation, telemetry batching, and localStorage persistence.
- Introduced Vitest unit tests (including contract, telemetry, and accessibility checks), Playwright e2e coverage, and Storybook stories.
- Provisioned CI workflow, Makefile, and documentation for development, testing, and build processes.
