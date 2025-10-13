# Unity Exporter

Service that assembles a templated Unity project archive with a default
scene, bootstrap script, and project settings wired for Unity 2022 LTS.

- **Endpoint:** `POST /export`
- **Request body (optional):**
  - `projectName` – name used for the root folder inside the archive.
  - `sceneName` – overrides the default scene name (`SampleScene`).
  - `description` – appended to the generated README for quick context.
- **Output:** `downloads/<project-name>-<timestamp>.zip`

The generated archive contains:

- `Assets/Scenes/<sceneName>.unity` – starter scene with camera and light.
- `Assets/Scripts/BlackRoadBootstrap.cs` – simple MonoBehaviour logging a
  welcome message when Play Mode starts.
- `ProjectSettings` and `Packages` manifests pre-populated for a 3D URP
  workflow.
- `README.md` describing how to open the project and next steps.

Future work can swap the static templates for real Unity Editor exports or
CI-driven builds.
