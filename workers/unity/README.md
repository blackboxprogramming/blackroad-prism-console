# Unity Exporter

Service that produces a minimal-but-legit Unity project template zip.

- **Health check:** `GET /healthz`
- **Export endpoint:** `POST /export`
  - Optional body: `{ "projectName": "MyProject", "sceneName": "Intro" }`
  - Output: timestamped archive in `downloads/`
- **Contents:** Unity 2022.3 scene (camera + light), sample script, manifest, and project settings.

The generated scene can be opened directly in Unity. Customize the request body to stamp a project/scene name and share the resulting archive with other agents.
