# Unity Exporter

The Unity exporter service turns a lightweight project template into a downloadable zip
that downstream build jobs can hydrate with real assets.

## API

- **Endpoint:** `POST /export`
- **Body:**
  ```json
  {
    "projectName": "BlackRoadPrototype",
    "sceneName": "SampleScene"
  }
  ```
  Both fields are optional. Names are sanitized to alphanumeric, space, underscore, and
  hyphen characters before being applied to the template.
- **Output:**
  ```json
  {
    "ok": true,
    "project": "BlackRoadPrototype",
    "scene": "SampleScene",
    "path": "/app/downloads/BlackRoadPrototype.zip"
  }
  ```
  The response path points to the generated archive on disk. Future iterations should
  stream the archive or upload it to object storage for direct download links.

## How It Works

1. Copies the `template/` directory into a temporary workspace.
2. Replaces `{{PROJECT_NAME}}` and `{{SCENE_NAME}}` tokens inside text files.
3. Runs the `zip` utility so the archive includes the project root folder.
4. Stores the archive under `downloads/` (creating the directory if needed).

The container image now installs the `zip` CLI to support step 3. Any environment running
the exporter locally must also provide the `zip` executable.

## Template Layout

```
template/
├── Assets
│   └── Scenes
│       └── SampleScene.unity
├── Packages
│   └── manifest.json
└── ProjectSettings
    ├── EditorBuildSettings.asset
    ├── ProjectSettings.asset
    └── ProjectVersion.txt
```

Text files within the template use simple tokens for substitution. Add new placeholders as
needed and register the file extensions in `server.js` so they receive replacements.

## Local Development

```bash
npm install
npm run start # or: node server.js
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{"projectName":"CityBuilder","sceneName":"Plaza"}'
```

The command returns the path to `downloads/CityBuilder.zip`. Extract the archive to inspect
the generated Unity scaffold.

## Next Steps

See [TASKS.md](./TASKS.md) for the coordination board tracking exporter follow-ups.
