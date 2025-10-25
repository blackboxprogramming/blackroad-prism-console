# Automation Wave 7

This directory tracks automation wave 7, covering tasks 201 through 300. Each
entry maps to an individual GitHub Actions workflow that invokes the reusable
automation runner defined in `.github/workflows/reusable-automation-task.yml`.
The metadata files capture the intended outcome, schedule, and linkage back to
the workflow definition so tooling can reason about the wave programmatically.

## Contents

- `task-<id>.yml` — structured metadata for each automation task.
- `manifest.json` — aggregated view of the wave for tooling and audits.
- `README.md` — this file.

Run `gh workflow run automation-task-<id>` to trigger any workflow manually.
