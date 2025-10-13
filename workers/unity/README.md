# Unity Exporter

Exports a Unity-ready project scaffold that teams can open directly in the editor.

- **Endpoint:** `POST /export`
- **Output directory:** `downloads/`
- **Response payload:** `{ ok, path, projectName, scenes, size, createdAt }`

## Request Format

Send a JSON body describing the desired project and scenes:

```jsonc
POST /export
{
  "projectName": "BlackRoad Sandbox",
  "description": "Prototype environment generated from the console.",
  "scenes": ["MainHub", "Playground"]
}
```

All fields are optional:

- `projectName` defaults to `BlackRoadUnityProject`.
- `scenes` defaults to `["MainScene"]` and is de-duplicated/sanitized.
- `description` is written into the generated README.

## Generated Layout

The zip bundles a minimal Unity 2022.3 LTS project with:

- `Assets/Scenes/*.unity` placeholders for each requested scene.
- `Packages/manifest.json` pre-populated with URP, TextMeshPro, and editor integrations.
- `ProjectSettings/` files (`ProjectVersion.txt`, `ProjectSettings.asset`, `EditorBuildSettings.asset`).
- `README.md` with setup guidance and the provided description.

This scaffold is designed for rapid iteration; teams can swap assets, update packages, or plug into a dedicated build pipeline as needed.
