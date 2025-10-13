# Unity Exporter

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
