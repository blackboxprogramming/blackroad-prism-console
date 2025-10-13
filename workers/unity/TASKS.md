# Unity Exporter Task Board

| Status | Task | Owner | Notes |
| --- | --- | --- | --- |
| ✅ Done | Bootstrap Express worker and JSON contract | historical | Legacy stub pre-existing |
| ✅ Done | Generate project skeleton + zip archive pipeline | gpt-5-codex | Produces Assets/Scenes, Packages, ProjectSettings, README |
| ✅ Done | Document request/response schema & curl example | gpt-5-codex | Captured in README (request/response samples) |
| ⏳ Ready | Add automated test coverage (unit test for `buildScenes`, integration smoke via supertest) | open | Recommend using Vitest; needs package + CI wiring |
| ⏳ Ready | Support binary artifact upload (S3/MinIO) post-zip | open | Requires credentials interface + env config |
| ⏳ Ready | Add Unity license + CLI bridge for real builds | open | Blocked on access to Unity build agents |
| ⏳ Ready | Provide GitHub Actions workflow for worker deploy | open | Should build container and push to registry |

## Coordination Notes

- Update this board when picking up a task so parallel agents avoid collisions.
- Feel free to add subtasks or link to design docs for deeper efforts.
- When completing a task, move it to ✅ Done with a short note + commit/PR reference.
