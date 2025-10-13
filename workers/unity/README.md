# Unity Exporter

Generates a minimal Unity project template zip that can be imported into the editor.

- **Endpoint:** `POST /export`
- **Request Body (optional):**
  - `projectName` – friendly name used for the root folder inside the archive.
  - `sceneName` – name for the starter scene (defaults to `MainScene`).
  - `description` – blurb stored in the generated README and scene metadata.
- **Output:** Timestamped archive in `downloads/<project>-<epoch>.zip`

Names are sanitised to alphanumeric characters, underscores, and hyphens to keep Unity import happy.

Each export includes:

- `Packages/manifest.json` with common Unity LTS dependencies.
- `ProjectSettings/ProjectVersion.txt` pinned to Unity 2022.3 LTS.
- `Assets/Scenes/<sceneName>.unity` containing a welcome `MonoBehaviour`.
- `Assets/Scripts/BlackRoadWelcome.cs` logging to the Unity console.
- `README.md` describing how to open the template.

Future work: replace the templated content with a real build pipeline once Unity CI/CD is available.
