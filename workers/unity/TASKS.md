# Unity Exporter Task Board

Use this board to coordinate Unity automation work. Move items between columns and add your handle when you pick something up.

## Backlog
- [ ] **Importer validation** — ensure generated Unity project passes `-batchmode -quit -projectPath` smoke test. _Unassigned_
- [ ] **Asset bundles** — add optional payload field to include packaged assets in the export. _Unassigned_
- [ ] **CI wiring** — integrate the exporter with GitHub Actions artifact uploads. _Unassigned_
- [ ] **Manifest presets** — allow choosing between HDRP/URP/Built-in render pipeline presets. _Unassigned_

## In Progress
- _None_

## Done
- [x] **Project skeleton export** — generate starter scene, script, and settings. _2025-02-14_
Coordinate Unity-focused work here. Keep at least fifteen actionable tasks on the list so agents always have something meaningful to pick up.

## Current Tasks

1. **Parameterize Template Metadata** – Allow callers to pass company/author info that hydrates into `ProjectSettings/ProjectSettings.asset`.
2. **Multiple Scene Support** – Extend the exporter so requests can create multiple scenes and update build settings accordingly.
3. **Asset Injection API** – Accept optional payloads for textures or prefabs (base64) and drop them into `Assets/` during export.
4. **Sample Geometry** – Add a basic ground plane and gizmo mesh to the template so the welcome rig has visible geometry.
5. **Automated Validation Tests** – Write Jest tests that invoke `/export` and assert the generated archive structure and key file contents.
6. **Zip-less Delivery Option** – Offer a tarball output or directory streaming mode for environments without the `zip` CLI.
7. **Persistent Archive Cache** – Cache previously generated archives keyed by project + scene to avoid redundant work on repeated requests.
8. **CLI Wrapper** – Provide a small Node CLI (`node cli/export-unity.js`) to trigger exports without hitting HTTP endpoints.
9. **Observability Hooks** – Emit structured logs/metrics (duration, archive size) for each export to support future dashboards.
10. **Docker Healthcheck** – Add a container healthcheck that pings `/health` and documents expected startup times.
11. **Template Versioning** – Embed a `TEMPLATE_VERSION` file and expose it via the API response for compatibility tracking.
12. **Environment QA Script** – Create a script that verifies the runtime has `zip` installed before server boot, failing fast otherwise.
13. **Unity Version Matrix** – Allow the request to choose between LTS branches (e.g., 2021 LTS vs 2022 LTS) with matching package manifests.
14. **README Enhancements** – Auto-append generation metadata (timestamp, request parameters) inside the template `README.md`.
15. **Integration with Unreal Exporter** – Define a shared contract so the Unity and Unreal exporters expose consistent request/response schemas.
