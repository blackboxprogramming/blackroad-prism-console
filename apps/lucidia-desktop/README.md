# Lucidia Desktop

Lucidia Desktop is BlackRoad's local-first AI workspace. The application is built with Tauri, React, and TypeScript to provide chat, codex memory, and task orchestration without a mandatory network connection. This scaffold includes the initial project layout, IPC contracts, storage helpers, and testing harnesses so future contributors can iterate confidently.
Lucidia Desktop is a local-first AI workspace that keeps chat, codex memory, and tasks together without depending on the cloud. The application is built with Tauri, React, and TypeScript, and is designed to run securely on your device.

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
ent server starts the Vite frontend. To launch the Tauri shell, run:

```bash
pnpm tauri dev
```

## Testing

```bash
pnpm test       # Vitest unit tests
pnpm lint       # ESLint
pnpm build-storybook
pnpm tauri build
```

## Project Structure

The app follows a local-first architecture with dedicated panels for chat, codex memory, tasks, and settings. Shared types and IPC schemas live under `src/shared`, UI components under `src/ui`, and the Tauri backend code under `tauri/`.

## Security and Privacy

- No network access is performed unless explicitly enabled by settings.
- Secrets are stored via OS keychain or encrypted storage APIs.
- All IPC payloads are validated using Zod schemas shared between Rust and TypeScript.

## Release Notes

See [`CHANGELOG.md`](./CHANGELOG.md) for version history.
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42

## Getting Started

```bash
pnpm install
pnpm dev
```

<<<<<<<+HEAD
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
ent server starts the Vite frontend. To launch the Tauri shell, run:

```bash
pnpm tauri dev
```

## Testing

```bash
pnpm test       # Vitest unit tests
pnpm lint       # ESLint
pnpm build-storybook
pnpm tauri build
```

## Project Structure

The app follows a local-first architecture with dedicated panels for chat, codex memory, tasks, and settings. Shared types and IPC schemas live under `src/shared`, UI components under `src/ui`, and the Tauri backend code under `tauri/`.

## Security and Privacy

- No network access is performed unless explicitly enabled by settings.
- Secrets are stored via OS keychain or encrypted storage APIs.
- All IPC payloads are validated using Zod schemas shared between Rust and TypeScript.

## Release Notes

See [`CHANGELOG.md`](./CHANGELOG.md) for version history.
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42
