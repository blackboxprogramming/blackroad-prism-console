# RoadWorld Authoring Shell

RoadWorld is a browser-based editor for composing deterministic 3D scenes. The application is
built with Next.js 14, React Three Fiber, and Zustand. This initial scaffold focuses on the editor
chrome, deterministic world schema, and import/export round-tripping of world data.

## Getting Started

```bash
pnpm install
pnpm --filter roadworld dev
```

The default development server runs at `http://localhost:3000`.

### Available Scripts

- `pnpm --filter roadworld dev` – run the development server
- `pnpm --filter roadworld build` – build for production
- `pnpm --filter roadworld start` – start the production server
- `pnpm --filter roadworld lint` – lint the project
- `pnpm --filter roadworld typecheck` – run TypeScript checks
- `pnpm --filter roadworld test` – run unit tests with Vitest
- `pnpm --filter roadworld test:e2e` – execute Playwright end-to-end tests

## Keyboard Shortcuts

Shortcut | Description
--- | ---
`W` | Translate gizmo
`E` | Rotate gizmo
`R` | Scale gizmo
`Ctrl/Cmd + Z` | Undo
`Ctrl/Cmd + Shift + Z` | Redo
`F` | Frame selection
`1/2/3` | Camera presets
`Del` | Delete selection

## Snapping & Grid

Snapping increments for translation, rotation, and scale come from the world settings inspector.
You can toggle snapping from the inspector panel and adjust increments.

## Import / Export

Use the top bar to export your world as JSON or import an existing world description. glTF assets
are supported through local file import; the file contents are referenced via `ObjectURL` metadata.

## Known Limitations

- Physics and VR features are stubbed behind feature flags.
- This scaffold uses placeholder HDR environment textures.
- Autosave relies on `localStorage` and requires a browser environment.

## Schema Reference

The canonical JSON schema lives at `src/shared/schema.ts`. All world persistence flows are
validated against this schema using Zod, ensuring deterministic editor state.
