# Unity Exporter

HTTP service that assembles a ready-to-open Unity project archive.

- **Endpoint:** `POST /export`
- **Output:** `downloads/<project-name>-<timestamp>.zip`

## Request Body

```json
{
  "projectName": "OrbitalGarden",
  "sceneName": "Greenhouse",
  "summary": "Prototype a systems-driven farming loop inside a biodome.",
  "features": [
    "Day/night cycle tied to plant growth",
    "Oxygen budget that shifts with player actions",
    "Narrative beats delivered via radio chatter"
  ]
}
```

All fields are optional. Sensible defaults are supplied when omitted.

## Archive Layout

The generated project contains a conventional Unity folder structure:

```
<ProjectName>/
  Assets/
    Scenes/
      <SceneName>.unity
      <SceneName>.unity.meta
    Scripts/
      <SceneName>Director.cs
      <SceneName>Director.cs.meta
  Packages/
    manifest.json
  ProjectSettings/
    EditorBuildSettings.asset
    ProjectSettings.asset
    ProjectVersion.txt
  README.md
```

`manifest.json` references common packages (Cinemachine, Input System, Timeline, TextMeshPro, Test Framework) to accelerate prototyping.

## Response

```json
{
  "ok": true,
  "path": "/workspace/blackroad-prism-console/workers/unity/downloads/OrbitalGarden-2025-10-05T14-33-21-123Z.zip",
  "fileName": "OrbitalGarden-2025-10-05T14-33-21-123Z.zip",
  "files": [
    "OrbitalGarden/Assets/Scenes/Greenhouse.unity",
    "OrbitalGarden/Assets/Scenes/Greenhouse.unity.meta",
    "OrbitalGarden/Assets/Scripts/GreenhouseDirector.cs",
    "OrbitalGarden/Assets/Scripts/GreenhouseDirector.cs.meta",
    "OrbitalGarden/Packages/manifest.json",
    "OrbitalGarden/ProjectSettings/EditorBuildSettings.asset",
    "OrbitalGarden/ProjectSettings/ProjectSettings.asset",
    "OrbitalGarden/ProjectSettings/ProjectVersion.txt",
    "OrbitalGarden/README.md"
  ],
  "metadata": {
    "projectName": "OrbitalGarden",
    "sceneName": "Greenhouse",
    "scriptClass": "GreenhouseDirector",
    "unityVersion": "2022.3.17f1",
    "generatedAt": "2025-10-05T14:33:21.123Z",
    "featureCount": 3
  }
}
```

## Notes

- Archives are written to `workers/unity/downloads/` by default. Clean the directory periodically if space becomes an issue.
- The generated scene includes a `MonoBehaviour` that echoes the requested summary and features at runtime.
- Replace the stub YAML/Text content with authoritative exports when the real build pipeline is available.
