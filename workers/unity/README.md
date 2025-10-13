# Unity Exporter

The Unity exporter service now scaffolds starter projects for one or more
Unity editor versions. Each request produces a zipped workspace that Codex
can extend, pre-populated with render pipeline dependencies and placeholder
scenes.

## Running the service

```bash
cd workers/unity
npm install
node server.js
```

The server listens on `PORT` (defaults to `3000`).

## Request format

`POST /export`

```jsonc
{
  "projectName": "BlackRoadSandbox",
  "unityVersions": ["2022.3.10f1", "6000.0.4f1"],
  "renderPipeline": "hdrp",          // builtin | urp | hdrp (optional)
  "template": "learning-lab"          // optional tag stored in the scene
}
```

### Response

```jsonc
{
  "ok": true,
  "projectName": "BlackRoadSandbox",
  "renderPipeline": "hdrp",
  "template": "learning-lab",
  "exports": [
    { "version": "2022.3.10f1", "path": "/.../downloads/BlackRoadSandbox-2022.3.10f1.zip" },
    { "version": "6000.0.4f1", "path": "/.../downloads/BlackRoadSandbox-6000.0.4f1.zip" }
  ]
}
```

Each archive contains:

- `ProjectSettings/ProjectVersion.txt` – locks the Unity editor release.
- `Packages/manifest.json` – enables render pipeline dependencies plus
  Cinemachine, Timeline, and IDE tooling.
- `ProjectSettings/ProjectSettings.asset` – seeds desktop-friendly defaults.
- `Assets/Scenes/<projectName>.unity` – placeholder scene annotated with the
  selected template tag.
- `README.md` – step-by-step instructions that reference the Codex Unity
  prompts for rapid follow-on authoring.

## Codex workflow

After extracting a generated archive, open it in Unity Hub and use the
prompts in [`codex/prompts/blackroad_high_impact_codex_prompts.prompt.md`](../../codex/prompts/blackroad_high_impact_codex_prompts.prompt.md)
to ask Codex for scene setup, gameplay scripts, or simulation logic. Keeping
multiple Unity versions installed lets Codex prototype against both long-term
support releases and the bleeding-edge editor, matching the "two versions"
request from production and research teams.
