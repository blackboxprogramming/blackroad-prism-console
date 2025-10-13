# Unity Exporter

Creates a downloadable Unity project scaffold so collaborators can start from a consistent baseline.

## API
- **Endpoint:** `POST /export`
- **Body:**
  ```json
  {
    "projectName": "OptionalName",
    "description": "Optional summary that lands in README.md"
  }
  ```
- **Response:**
  ```json
  {
    "ok": true,
    "projectName": "OptionalName",
    "zipName": "OptionalName-1700000000000.zip",
    "zipPath": "<repo>/downloads/OptionalName-1700000000000.zip",
    "filesGenerated": 6
  }
  ```

## Output
The archive includes:
- `README.md` primed with the supplied description.
- `ProjectSettings/ProjectVersion.txt` targeting Unity `2022.3.16f1`.
- A minimal `EditorBuildSettings.asset` referencing the prototype scene.
- `Packages/manifest.json` with baseline dependencies used across our tooling.
- `Assets/Scenes/Prototype.unity` containing a bootstrapped scene root.
- `Assets/Scripts/Bootstrap.cs` to verify scripting setup.

## Requirements
- Node.js 18+
- The `zip` CLI (`apt install zip` on Debian/Ubuntu) used to package the scaffold.

## Local Development
1. Install dependencies: `npm install` (only Express at the moment).
2. Start the worker: `node server.js` (or `npm start` if you add a script).
3. Trigger an export:
   ```bash
   curl -X POST http://localhost:3000/export \
     -H "content-type: application/json" \
     -d '{"projectName": "BlackRoadPrototype", "description": "Shared sandbox for gameplay experiments."}'
   ```
4. Retrieve the zip from the `downloads/` directory.

## Next Steps
See [`TASKS.md`](./TASKS.md) for coordination notes and upcoming improvements.
