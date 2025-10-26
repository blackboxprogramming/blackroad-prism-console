# Lucidia Desktop

Lucidia Desktop is BlackRoad's local-first AI workspace. The application is built with Tauri, React, and TypeScript to provide chat, codex memory, and task orchestration without a mandatory network connection. This scaffold includes the initial project layout, IPC contracts, storage helpers, and testing harnesses so future contributors can iterate confidently.

## Getting Started

```bash
pnpm install
pnpm dev
```

The development server runs Vite alongside the Tauri shell. All data persists inside the platform-specific application directory managed by Tauri.

## Scripts

- `pnpm dev` – start Vite in development mode with the Tauri shell.
- `pnpm build` – build the React frontend assets.
- `pnpm tauri build` – produce platform installers.
- `pnpm test` – run Vitest unit tests.
- `pnpm build-storybook` – build the Storybook catalog.

## Directory Layout

- `src/shared` – shared TypeScript types, constants, and IPC schemas.
- `src/ui` – React application code, hooks, and component primitives.
- `src/tauri` – Rust source for the Tauri process and IPC command handlers.
- `tests` – unit and end-to-end test suites.
- `.storybook` – Storybook configuration.

## Security & Privacy

Lucidia Desktop ships with local-first defaults: IPC payloads are validated via Zod, markdown rendering is sanitized, and secure storage uses the OS keychain via Stronghold-compatible fallbacks. Secrets never touch plain files.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `pnpm install` from the monorepo root.
3. Make changes and cover them with tests.
4. Run `pnpm lint` and `pnpm test` before submitting a pull request.

Refer to the `CHANGELOG.md` for release history.
