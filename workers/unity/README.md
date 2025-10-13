# Unity Exporter

Stub service that writes a placeholder Unity project zip with a basic scene and script scaffold.

- **Endpoint:** `POST /export`
- **Request Body (optional):**
  - `projectName`: Custom folder name used inside the archive.
  - `sceneName`: Scene file name placed under `Assets/Scenes/`.
  - `scriptName`: MonoBehaviour script generated under `Assets/Scripts/`.
- **Output:** Timestamped archive under `downloads/<projectName>-<timestamp>.zip`

The generated archive includes Unity `ProjectSettings`, `Packages` manifests, a sample scene containing a camera and cube, and a `MonoBehaviour` script that rotates the cube. Replace with a real Unity build pipeline when available.
