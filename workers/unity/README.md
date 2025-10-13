# Unity Exporter

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
