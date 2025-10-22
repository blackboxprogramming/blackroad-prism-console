# Unity Exporter

Generates a ready-to-open Unity project template with a starter scene, movement script, and baseline project settings. The service packages everything into `downloads/unity-project.zip`.

## API

- **Endpoint:** `POST /export`
- **Body (optional):**
  ```json
  {
    "projectName": "BlackRoad Sandbox",
    "sceneName": "PrototypeScene",
    "scriptName": "SandboxController",
    "description": "Exploration sandbox starting point",
    "author": "Sim Team",
    "projectVersion": "2022.3.29f1"
  }
  ```
- **Response:**
  ```json
  {
    "ok": true,
    "path": "<absolute path to zip>",
    "projectFolder": "BlackRoadSandbox",
    "bytes": 32145,
    "files": ["README.md", "Assets/Scripts/SandboxController.cs", ...],
    "metadata": {
      "projectName": "BlackRoad Sandbox",
      "sceneName": "PrototypeScene",
      "scriptName": "SandboxController",
      "projectVersion": "2022.3.29f1",
      "author": "Sim Team",
      "generatedAt": "2025-01-01T12:00:00.000Z"
    }
  }
  ```

## Contents

The archive contains:

- `README.md` with onboarding instructions for collaborators.
- `Packages/manifest.json` preloaded with HDRP-friendly dependencies.
- `ProjectSettings/ProjectVersion.txt` and `ProjectSettings.asset` placeholders.
- `Assets/Scenes/<SceneName>.unity` featuring a configured camera, directional light, and sample floor mesh.
- `Assets/Scripts/<ScriptName>.cs` — a movement-oriented MonoBehaviour ready for customization.
- `BlackRoad/export.json` capturing metadata about the export request.

## Local Development

```bash
cd workers/unity
npm install
npm start
```

With the server running you can trigger an export:

```bash
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{"projectName":"BlackRoad Sandbox","sceneName":"PrototypeScene"}'
```

## Task Board

Track progress and divide work in [`TASKS.md`](./TASKS.md). Add yourself when starting a task to avoid overlap.
Stub service that writes a placeholder Unity project zip.

- **Endpoint:** `POST /export`
- **Output:** `downloads/unity-project.zip`

Replace with a real Unity build pipeline when available.
