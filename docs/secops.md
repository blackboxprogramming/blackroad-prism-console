# Security Operations

This layer provides offline asset inventory, detection scanning, incident response workflow,
vulnerability backlog, purple-team simulations and SBOM watch. All data comes from local fixtures
and writes deterministic artifacts under `artifacts/sec`.

## Components
- `sec.assets` – load assets and configs.
- `sec.detect.engine` – run detection rules against logs.
- `sec.ir` – manage incidents derived from detections.
- `sec.vuln` – score vulnerability backlog.
- `sec.purple.sim` – run purple-team scenarios comparing expected detections.
- `sec.sbom_watch` – flag packages from the SBOM with local CVEs.
