# Unity Exporter

Generates a ready-to-open Unity project archive from a lightweight JSON payload.
The service copies a templated project, rewrites metadata based on the request,
and ships a zipped folder into `downloads/` for downstream automation.

- **Endpoint:** `POST /export`
- **Response:** JSON metadata plus the path to the generated zip
- **Unity version:** 2022.3.18f1 (safe to upgrade in the template if required)

## Request shape

```jsonc
{
  "projectName": "BlackRoad Systems Prototype",   // optional
  "sceneName": "Launch Pad",                      // optional
  "author": "Agent Smith",                        // optional
  "description": "Short summary for the README.", // optional
  "sceneGuid": "...",                             // optional 32-char hex
  "scriptGuid": "..."                             // optional 32-char hex
}
```

All fields are optional. Missing or empty values fall back to sensible defaults
(`BlackRoad Sample`, `Sample Scene`, etc.).

## Response payload

```jsonc
{
  "ok": true,
  "path": "<absolute path to downloads/<slug>.zip>",
  "project": {
    "name": "BlackRoad Systems Prototype",
    "slug": "blackroad-systems-prototype",
    "scene": {
      "name": "Launch Pad",
      "file": "Assets/Scenes/LaunchPad.unity",
      "guid": "3c2f..."
    },
    "scriptGuid": "a451...",
    "author": "Agent Smith",
    "description": "Short summary for the README."
  }
}
```

## Template contents

The template (under `./template`) includes:

- `ProjectSettings/ProjectVersion.txt` pinned to Unity `2022.3.18f1`
- `ProjectSettings/ProjectSettings.asset` with placeholder metadata
- `Packages/manifest.json` with core dependencies only
- `Assets/Scenes/<Scene>.unity` and matching `.meta` file wired to the supplied GUID
- `Assets/Scripts/HelloBlackRoad.cs` plus `.meta` file, pre-attached in the scene
- A generated README summarizing the chosen metadata for collaborators

Feel free to evolve the template to match evolving project standards (URP/HDRP,
additional packages, custom scripts, etc.).

## Running locally

```bash
cd workers/unity
npm install
node server.js
```

Then POST to `http://localhost:3000/export` with your JSON payload. The resulting
zip lands under `workers/unity/downloads/`.
