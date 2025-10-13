# Unity Exporter

Service that scaffolds a Unity project archive from structured JSON input.

- **Endpoint:** `POST /export`
- **Output:** `downloads/<project-name>-<timestamp>.zip`
- **Runtime:** Node.js 20 / Express

## Request payload

```json
{
  "projectName": "SpaceMiner",
  "companyName": "BlackRoad",
  "productName": "Space Miner",
  "unityVersion": "2022.3.40f1",
  "scenes": [
    { "name": "MainMenu", "description": "UI scene" },
    { "name": "Gameplay", "enabled": true }
  ],
  "packages": [
    { "name": "com.unity.cinemachine", "version": "2.9.7" },
    "com.unity.inputsystem"
  ]
}
```

All fields are optional. Missing data falls back to sensible defaults (SampleScene, URP packages, etc.).

## Response payload

```json
{
  "ok": true,
  "project": {
    "name": "SpaceMiner",
    "unityVersion": "2022.3.40f1",
    "companyName": "BlackRoad",
    "productName": "Space Miner"
  },
  "scenes": [
    {
      "name": "Gameplay",
      "path": "Assets/Scenes/Gameplay.unity",
      "enabled": true
    },
    {
      "name": "MainMenu",
      "path": "Assets/Scenes/MainMenu.unity",
      "enabled": true
    }
  ],
  "packages": {
    "com.unity.ide.rider": "3.0.29",
    "com.unity.render-pipelines.universal": "14.0.11",
    "com.unity.cinemachine": "2.9.7",
    "com.unity.inputsystem": "latest"
  },
  "requestedPackages": [
    { "name": "com.unity.cinemachine", "version": "2.9.7" },
    { "name": "com.unity.inputsystem", "version": "latest" }
  ],
  "archive": {
    "path": "downloads/SpaceMiner-lmno1234.zip",
    "sizeBytes": 12345
  }
}
```

> `archive.path` is relative to the worker root so callers can publish or stream the file elsewhere. `requestedPackages` echoes the caller-supplied overrides for quick auditing.

## Generated layout

The exporter synthesises a Unity-friendly skeleton:

```
<project>
├── Assets/
│   └── Scenes/
│       └── <SceneName>.unity
├── Packages/
│   └── manifest.json
├── ProjectSettings/
│   ├── EditorBuildSettings.asset
│   ├── ProjectSettings.asset
│   └── ProjectVersion.txt
└── README.md
```

Scene files use a lightweight YAML stub with a root `GameObject` so Unity can import them immediately.

## Development

```bash
cd workers/unity
npm install
node server.js
```

Send a request with `curl`:

```bash
curl -X POST http://localhost:3000/export \
  -H 'content-type: application/json' \
  -d '{"projectName":"Test","scenes":["Main"]}'
```

The service requires the `zip` CLI (present in the base container and Dockerfile).

## Coordination

See [`TASKS.md`](./TASKS.md) for the shared backlog and ownership tracking so multiple agents avoid duplicate work.
