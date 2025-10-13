# Unity Exporter

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
