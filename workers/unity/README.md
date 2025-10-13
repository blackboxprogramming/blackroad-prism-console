# Unity Exporter

Service that assembles a minimal Unity project scaffold and zips it for
download.

## Endpoint

- **Route:** `POST /export`
- **Output:** JSON payload describing the generated archive. The archive is
  written to `downloads/<project>-<timestamp>.zip`.

## Request body

```json
{
  "projectName": "SpaceGarden",
  "description": "Prototype scenes for the Space Garden concept.",
  "scenes": ["Hub", { "name": "Playfield" }]
}
```

- `projectName` (optional): name used for the Unity project folder. Defaults to
  `BlackRoadUnity` when omitted or invalid.
- `description` (optional): written to the generated README.
- `scenes` (optional): array of scene names (string or `{ "name": string }`).
  Invalid entries are ignored and at least one placeholder scene is always
  created.

## Response

```json
{
  "ok": true,
  "projectName": "SpaceGarden",
  "path": "/app/workers/unity/downloads/SpaceGarden-lxqhcp.zip",
  "files": [
    "Assets/Scenes/Hub.unity",
    "Assets/Scenes/Playfield.unity",
    "Assets/Scripts/README.md",
    "Packages/manifest.json",
    "ProjectSettings/EditorBuildSettings.asset",
    "ProjectSettings/ProjectVersion.txt",
    "README.md"
  ]
}
```

Each `.unity` scene file is a placeholder that should be opened and saved in the
Unity editor. The archive includes minimal ProjectSettings and Packages content
so the project can be opened immediately.
