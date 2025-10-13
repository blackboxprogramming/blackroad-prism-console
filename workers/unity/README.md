# Unity Exporter

Service that generates a minimal, bootable Unity project template and returns
the path to a zipped archive on disk.

- **Endpoint:** `POST /export`
- **Request body (optional):** `{ "projectName": "MyPrototype" }`
- **Output:** JSON payload containing the resolved project name, on-disk path,
  and file list for the generated archive.
- **Archive contents:**
  - Project scaffolding (Assets, Packages, ProjectSettings)
  - A sample scene with a camera + directional light
  - Starter `Bootstrap.cs` script with a console log
  - Unity `manifest.json` and `ProjectVersion.txt` set to 2022.3 LTS

Example invocation:

```bash
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{"projectName":"BlackRoadPrototype"}'
```

Replace with a full Unity build pipeline once the exporter is wired to actual
project assets and CI artifacts.
