# Unity Exporter

Stub Unity exporter that now emits a bootable prototype project zip.

- **Endpoint:** `POST /export`
- **Body:**
  ```jsonc
  {
    "projectName": "Orbital Lab",
    "description": "Zero-g lab mock up",
    "scene": {
      "name": "LabDeck",
      "objects": [
        {
          "name": "CentralPlatform",
          "type": "Cylinder",
          "position": { "x": 0, "y": 0, "z": 0 },
          "scale": { "x": 3, "y": 0.25, "z": 3 }
        }
      ]
    }
  }
  ```
- **Output:** `downloads/<slug>-<timestamp>.zip`
- **Contents:** Unity scene, runtime bootstrap script, and machine-readable scene plan.

Open the generated project in Unity 2021 LTS (or newer) and load the scene from
`Assets/Scenes`. The `GeneratedSceneController` component spawns the configured
primitives at runtime so teams can iterate without hand-authoring boilerplate.
