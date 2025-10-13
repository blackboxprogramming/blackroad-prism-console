# Unity Exporter

Stub service that builds a structured Unity project archive that can be
opened directly in the editor. The scaffold includes default project
settings, a sample scene, and a starter C# MonoBehaviour script so teams
can iterate without starting from an empty workspace.

- **Endpoint:** `POST /export`
- **Output:** `downloads/<project-slug>-<timestamp>.zip`

### Request Payload

```json
{
  "projectName": "Orbital Lab",
  "description": "Physics-driven sandbox prototype",
  "scenes": ["LaunchPad", "ZeroGHangar"]
}
```

- `projectName` (optional): Shown in the README and used for archive
  naming.
- `description` (optional): Added to the README and the starter script
  summary.
- `scenes` (optional): Array of scene names to pre-create under
  `Assets/Scenes`. Defaults to `SampleScene`.

### Generated Contents

- `README.md` with setup instructions and project metadata.
- `ProjectSettings/` assets including a Unity 2022.3 LTS
  `ProjectVersion.txt` and build settings referencing generated scenes.
- `Packages/manifest.json` with common Unity packages preconfigured.
- `Assets/Scenes/*.unity` YAML scenes referencing the starter script.
- `Assets/Scripts/HelloBlackRoad.cs` MonoBehaviour that rotates the
  attached object and logs project boot info.

Replace with a real Unity build pipeline when available.
