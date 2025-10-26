# Lucidia Desktop

Lucidia Desktop is a local-first AI workspace that keeps chat, codex memory, and tasks together without depending on the cloud. The application is built with Tauri, React, and TypeScript, and is designed to run securely on your device.

## Getting Started

```bash
pnpm install
pnpm dev
```

The development server starts the Vite frontend. To launch the Tauri shell, run:

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
