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
A lightweight service that scaffolds a Unity project and packages it as a zip file.

- **Endpoint:** `POST /export`
- **Body (optional):**
  - `projectName` — folder name for the generated project.
  - `sceneName` — default scene stub to create under `Assets/Scenes`.
  - `scriptName` — C# script file name created under `Assets/Scripts`.
  - `scriptContents` — override the default `MonoBehaviour` template.
  - `sceneContents` — override the placeholder scene notes.
- **Output:** `downloads/<project>-<timestamp>.zip`

The exporter creates Unity-style directories (`Assets`, `Packages`, `ProjectSettings`) with
starter content so collaborators can open the archive directly in Unity and continue building.
Service that builds a starter Unity project archive on demand.

- **Endpoint:** `POST /export`
- **Body:** optional JSON `{ "projectName": "MyProject", "sceneName": "IntroScene" }`
- **Output:** `downloads/<project-name>-<timestamp>-<hash>.zip`

The zip includes a Unity project root with:

- Default project and package settings targeting Unity `2022.3.17f1`.
- A sample scene with a camera and directional light.
- A `HelloBlackRoad` MonoBehaviour script and quick-start README.

## Local development

```bash
npm install
node server.js
```

Then, in a separate shell, request an export:

```bash
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{"projectName":"BlackRoadShowcase","sceneName":"DemoScene"}'
```

The generated archive will be placed in the `downloads/` directory.
Service that assembles a Unity-friendly project archive from structured JSON input.

- **Endpoint:** `POST /export`
- **Request Body (JSON):**
  - `projectName` *(string, optional)* – project label used for the root folder and archive name.
  - `description` *(string, optional)* – copied into the generated `README.md`.
  - `scenes` *(array, optional)* – list of scene descriptors. Each entry may specify:
    - `name` – scene display name.
    - `description` – note surfaced in the bootstrap MonoBehaviour.
    - `camera.position` `{ x, y, z }` – initial camera placement.
    - `camera.rotation` `{ x, y, z }` – Euler rotation values.
    - `rotationSpeed` – cube rotation speed exposed to the bootstrap script.
- **Output:** Timestamped zip in `downloads/` containing:
  - `Packages/manifest.json` with baseline dependencies.
  - `ProjectSettings/` assets (editor build settings + Unity version).
  - `Assets/Scripts/Bootstrap.cs` and metadata file.
  - `Assets/Scenes/*.unity` stubs wired to the bootstrap MonoBehaviour (+ `.meta`).
  - `blackroad_export.json` manifest of the export request and `README.md` summary.

## Example

```bash
curl -X POST http://localhost:3000/export \
  -H 'Content-Type: application/json' \
  -d '{
        "projectName": "BlackRoad Prototype",
        "description": "Generated via exporter",
        "scenes": [
          {
            "name": "City",
            "description": "Daytime lighting stub",
            "camera": {"position": {"x": 0, "y": 2, "z": -6}},
            "rotationSpeed": 20
          }
        ]
      }'
```

The response includes the final archive name, filesystem path, and echoed metadata describing the generated project.
