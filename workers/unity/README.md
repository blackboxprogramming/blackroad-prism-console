# Unity Exporter

Service that assembles a starter Unity project zip from a maintained
template.

- **Endpoint:** `POST /export`
- **Body:**
  ```json
  {
    "projectName": "My Space Sim",
    "description": "Pitch or design notes for the build",
    "welcomeMessage": "Custom log message for the bootstrap script"
  }
  ```
- **Output:** `downloads/<projectName>-<timestamp>.zip`
- **Contents:**
  - `Packages/manifest.json` and `ProjectSettings/ProjectVersion.txt`
    seeded from the repository template.
  - `Assets/Scripts/BlackRoadBootstrap.cs` generated with the provided
    project name and welcome message.
  - `PROJECT_OVERVIEW.md` summarising next steps and mirroring the
    supplied description.
  - `BlackRoadConfig.json` capturing the request payload for traceability.

### Local development

```bash
npm install
npm start
# POST to http://localhost:3000/export with the JSON body above
```

The service writes exported archives to `downloads/`. Remove old files as
needed to avoid confusion during iterative testing.
