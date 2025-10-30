# Unity Exporter

Generates a ready-to-open Unity project template with a starter scene, movement script, and baseline project settings. The service packages everything into `downloads/unity-project.zip`.

## Automation hooks

- `python agents/unity_world_builder.py` wraps the exporter for the command bus.
- The CLI accepts flags for project metadata and emits either a human summary or JSON payload.
- Agent intent `build unity world` maps directly to this command for hands-free exports.

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
Exports a Unity-ready project scaffold that teams can open directly in the editor.

- **Endpoint:** `POST /export`
- **Output directory:** `downloads/`
- **Response payload:** `{ ok, path, projectName, scenes, size, createdAt }`

## Request Format

Send a JSON body describing the desired project and scenes:

```jsonc
POST /export
{
  "projectName": "BlackRoad Sandbox",
  "description": "Prototype environment generated from the console.",
  "scenes": ["MainHub", "Playground"]
}
```

All fields are optional:

- `projectName` defaults to `BlackRoadUnityProject`.
- `scenes` defaults to `["MainScene"]` and is de-duplicated/sanitized.
- `description` is written into the generated README.

## Generated Layout

The zip bundles a minimal Unity 2022.3 LTS project with:

- `Assets/Scenes/*.unity` placeholders for each requested scene.
- `Packages/manifest.json` pre-populated with URP, TextMeshPro, and editor integrations.
- `ProjectSettings/` files (`ProjectVersion.txt`, `ProjectSettings.asset`, `EditorBuildSettings.asset`).
- `README.md` with setup guidance and the provided description.

This scaffold is designed for rapid iteration; teams can swap assets, update packages, or plug into a dedicated build pipeline as needed.
Stub Unity exporter that now emits a bootable prototype project zip.

- **Endpoint:** `POST /export`
- **Body:**
  ```jsonc
  {
    "projectName": "Orbital Lab",
    "description": "Zero-g lab mock up",
    "scene": {
      "name": "LabDeck",
      "objects": [
        {
          "name": "CentralPlatform",
          "type": "Cylinder",
          "position": { "x": 0, "y": 0, "z": 0 },
          "scale": { "x": 3, "y": 0.25, "z": 3 }
        }
      ]
    }
  }
  ```
- **Output:** `downloads/<slug>-<timestamp>.zip`
- **Contents:** Unity scene, runtime bootstrap script, and machine-readable scene plan.

Open the generated project in Unity 2021 LTS (or newer) and load the scene from
`Assets/Scenes`. The `GeneratedSceneController` component spawns the configured
primitives at runtime so teams can iterate without hand-authoring boilerplate.
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
Service that assembles a templated Unity project archive with a default
scene, bootstrap script, and project settings wired for Unity 2022 LTS.

- **Endpoint:** `POST /export`
- **Request body (optional):**
  - `projectName` – name used for the root folder inside the archive.
  - `sceneName` – overrides the default scene name (`SampleScene`).
  - `description` – appended to the generated README for quick context.
- **Output:** `downloads/<project-name>-<timestamp>.zip`

The generated archive contains:

- `Assets/Scenes/<sceneName>.unity` – starter scene with camera and light.
- `Assets/Scripts/BlackRoadBootstrap.cs` – simple MonoBehaviour logging a
  welcome message when Play Mode starts.
- `ProjectSettings` and `Packages` manifests pre-populated for a 3D URP
  workflow.
- `README.md` describing how to open the project and next steps.

Future work can swap the static templates for real Unity Editor exports or
CI-driven builds.
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
Generates a ready-to-open Unity project template that boots with a welcome scene, camera, light, and a simple `MonoBehaviour` script. The exporter hydrates placeholders in the template so each archive reflects the requested project and scene names.

## API

### `GET /health`
Returns `{ ok: true }` for liveness probes.

### `POST /export`
Creates a zipped Unity project under `downloads/`.

**Request body**
```json
{
  "projectName": "BlackRoadExplorer",
  "sceneName": "LandingScene"
}
```
Both fields are optional; they default to `BlackRoadUnityProject` and `MainScene` when omitted.

**Response**
```json
{
  "ok": true,
  "path": "downloads/blackroadexplorer.zip",
  "projectName": "BlackRoadExplorer",
  "sceneName": "LandingScene",
  "archiveName": "blackroadexplorer.zip"
}
```

The archive contains:
- `Assets/Scenes/<Scene>.unity` — starter scene with camera, light, and welcome rig.
- `Assets/Scripts/WelcomeController.cs` — rotates the rig and logs the welcome message.
- `Packages/manifest.json` — standard desktop dependencies.
- `ProjectSettings/` — version/build settings so Unity opens the project without prompts.
- `README.md` — instructions embedded in the template.

The exporter requires the `zip` CLI (available in the runtime containers used by this repo).

## Local development

```bash
cd workers/unity
node server.js
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Demo", "sceneName":"IntroScene"}'
```

The generated archive lives in `workers/unity/downloads/` when running locally.
Generates a ready-to-import Unity project template with metadata, scene, and script stubs.

- **Endpoint:** `POST /export`
- **Output:** `downloads/<project-slug>.zip`

## Request payload

```json
{
  "projectName": "BlackRoad Prism World",
  "sceneName": "Gateway Plaza",
  "description": "Starter Unity scene generated by the Prism exporter.",
  "author": "BlackRoad Studios"
}
```

All fields are optional. The exporter sanitizes input, derives a scene filename, and stamps metadata into the generated assets.

## Generated structure

```
<slug>.zip
├── README.md
├── .gitignore
├── ProjectSettings/
│   ├── ProjectSettings.asset
│   ├── ProjectVersion.txt
│   └── EditorBuildSettings.asset
├── Packages/
│   ├── manifest.json
│   └── packages-lock.json
└── Assets/
    ├── Scenes/
    │   ├── <SceneName>.unity
    │   └── <SceneName>.unity.meta
    └── Scripts/
        ├── SceneMetadata.cs
        └── SceneMetadata.cs.meta
```

The included `SceneMetadata` MonoBehaviour logs project details at runtime so teammates know where the scene originated.
Stub service that writes a placeholder Unity project zip with a basic scene and script scaffold.

- **Endpoint:** `POST /export`
- **Request Body (optional):**
  - `projectName`: Custom folder name used inside the archive.
  - `sceneName`: Scene file name placed under `Assets/Scenes/`.
  - `scriptName`: MonoBehaviour script generated under `Assets/Scripts/`.
- **Output:** Timestamped archive under `downloads/<projectName>-<timestamp>.zip`

The generated archive includes Unity `ProjectSettings`, `Packages` manifests, a sample scene containing a camera and cube, and a `MonoBehaviour` script that rotates the cube. Replace with a real Unity build pipeline when available.
