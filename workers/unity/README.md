# Unity Exporter

A lightweight service that assembles a starter Unity project and packages it as a zip archive. The exported archive contains Assets, ProjectSettings, and Packages directories so the project opens cleanly in Unity 2022.3 LTS and newer releases.

## Local development

```bash
npm install
npm start
```

The service listens on port `3000` by default. Use `PORT=<number> npm start` to override the port.

## API

- **Endpoint:** `POST /export`
- **Body (JSON):**
  - `projectName` (string, optional) – project title used for generated files.
  - `description` (string, optional) – copied into the generated README.
  - `scenes` (array of strings, optional) – scene names to scaffold under `Assets/Scenes`.
- **Response:**
  ```json
  {
    "ok": true,
    "path": "<absolute path to the zip file>",
    "fileName": "<archive name>",
    "projectName": "<resolved project name>",
    "scenes": ["..."],
    "description": "..."
  }
  ```

## Example

```bash
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{
        "projectName": "BlackRoad Sandbox",
        "description": "Prototype world streaming sandbox",
        "scenes": ["MainMenu", "Gameplay", "Credits"]
      }'
```

The service responds with the archive location inside the `downloads/` folder (created on demand). Each scene receives a placeholder `.unity` file so the project opens without errors, and metadata files are populated with sensible defaults for further iteration.
