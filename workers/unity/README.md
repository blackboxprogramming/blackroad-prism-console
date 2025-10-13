# Unity Exporter

A lightweight service that scaffolds a Unity project and packages it as a zip file.

- **Endpoint:** `POST /export`
- **Body (optional):**
  - `projectName` — folder name for the generated project.
  - `sceneName` — default scene stub to create under `Assets/Scenes`.
  - `scriptName` — C# script file name created under `Assets/Scripts`.
  - `scriptContents` — override the default `MonoBehaviour` template.
  - `sceneContents` — override the placeholder scene notes.
- **Output:** `downloads/<project>-<timestamp>.zip`

The exporter creates Unity-style directories (`Assets`, `Packages`, `ProjectSettings`) with
starter content so collaborators can open the archive directly in Unity and continue building.
