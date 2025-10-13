# Unity Exporter

A lightweight scaffolding service that builds a Unity-compatible project template and delivers it as a ZIP archive. Use it to bootstrap prototypes while the full build pipeline is under construction.

## Features

- Generates a structured Unity project with Assets, Packages, and ProjectSettings folders.
- Accepts metadata such as project name, scene names, notes, and package overrides.
- Emits a `BlackRoad/export.json` manifest summarizing the export payload.
- Available as both an HTTP endpoint and a local CLI helper (`npm run export:sample`).

## Quick Start

```bash
cd workers/unity
npm install
npm run export:sample
```

The sample script writes a fresh archive to `downloads/unity/` and prints the metadata payload. Feel free to edit `scripts/export-sample.mjs` to match your prototype requirements.

To run the HTTP service instead:

```bash
npm start
```

This launches the Express server on `http://localhost:3000`. Use the `/export` route described below.

## HTTP API

`POST /export`

**Request body**

```json
{
  "projectName": "BlackRoad Sandbox",
  "description": "Playable block world prototype",
  "author": "PrototypeAgent",
  "scenes": ["Landing", "Gameplay", "Credits"],
  "notes": "Focus on controller feel + chunk streaming",
  "packages": [
    "com.unity.cinemachine@2.9.7",
    { "name": "com.unity.postprocessing", "version": "3.4.1" }
  ]
}
```

**Response**

```json
{
  "ok": true,
  "path": "/workspace/blackroad-prism-console/downloads/unity/blackroad-sandbox-2025-10-05T00-00-00-000Z.zip",
  "fileName": "blackroad-sandbox-2025-10-05T00-00-00-000Z.zip",
  "bytesWritten": 14823,
  "project": {
    "projectName": "BlackRoad Sandbox",
    "slug": "blackroad-sandbox",
    "description": "Playable block world prototype",
    "author": "PrototypeAgent",
    "createdAt": "2025-10-05T00:00:00.000Z",
    "scenes": [
      { "name": "Landing", "file": "Assets/Scenes/Landing.unity" },
      { "name": "Gameplay", "file": "Assets/Scenes/Gameplay.unity" },
      { "name": "Credits", "file": "Assets/Scenes/Credits.unity" }
    ],
    "packages": {
      "com.unity.collab-proxy": "2.0.6",
      "com.unity.inputsystem": "1.7.0",
      "com.unity.textmeshpro": "3.0.6",
      "com.unity.cinemachine": "2.9.7",
      "com.unity.postprocessing": "3.4.1"
    }
  }
}
```

### Validation rules

- `projectName` must be a non-empty string.
- `scenes` can be a string or array; invalid entries are replaced with numbered placeholders.
- `packages` accepts arrays of strings (`"name@version"`), arrays of `{ name, version }` objects, or a dictionary of package names to versions.

### Output Layout

The exported archive contains:

```
<ProjectSlug>/
  README.md
  BlackRoad/export.json
  Documentation/notes.md
  Assets/
    Scenes/<Scene>.unity
    Scripts/README.md
  Packages/manifest.json
  ProjectSettings/
    ProjectSettings.asset
    ProjectVersion.txt
    EditorBuildSettings.asset
```

Use the placeholders as a starting point and replace them with production-ready content inside the Unity editor.
