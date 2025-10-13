# Unity Exporter

Stub service that now assembles a lightweight, editor-ready Unity project
template. The export is a `.zip` archive that includes project settings,
package manifest, and a simple SampleScene so the project opens cleanly in
Unity Hub.

- **Endpoint:** `POST /export`
- **Body:**
  ```json
  {
    "projectName": "OptionalName", // defaults to "BlackRoadUnityTemplate"
    "description": "Optional README summary"
  }
  ```
- **Output:** `downloads/<sanitized-project-name>.zip`
- **Response:** lists all files included in the archive for quick inspection.

Replace with a real Unity build pipeline when available.
