# Codex Automation

This directory houses small utilities that help automate development
workflows and record foundational Codex entries. The new **BlackRoad
pipeline** script provides a single entry point for pushing code through
GitHub and into the BlackRoad.io deployment.  It currently focuses on
scaffolding the pipeline with clear extension points for future
integrations.

## Codex Entries

| ID  | Title                  | Description                                     |
| --- | ---------------------- | ----------------------------------------------- |
| 001 | The First Principle    | Lucidia exists to protect and empower everyone. |
| 003 | The Workflow Circle    | Work runs in visible capture → adjust loops.    |
| 004 | The Autonomy Manifest  | Data autonomy through consent, export, and wipe. |
| 022 | The Security Spine     | Security backbone with layered zero-trust defenses. |
| 043 | The Equity Oath        | Fairness, access, and inclusion are systemic.   |
| 044 | The Transparency of Process | Trust grows when workflows stay visible end-to-end. |

## BlackRoad Pipeline

```bash
python3 codex/agents/blackroad_pipeline.py "Push latest to BlackRoad.io"
```

Available commands:

* `Push latest to BlackRoad.io` – commit/push then deploy
* `Refresh working copy and redeploy` – alias for push workflow
* `Rebase branch and update site` – rebase on `origin/main` before push
* `Sync Salesforce -> Airtable -> Droplet` – placeholder for connector syncs

Each command prints the high level actions it would perform.  Real OAuth
or webhook logic can be added by filling in the TODO sections inside the
script.

_Last updated on 2025-09-11_

## Unity engine bootstrap

Codex can now ask the Unity exporter service to scaffold multiple editor
targets at once. Start the service with:

```bash
node workers/unity/server.js
```

Then request paired Unity builds (for example, current LTS and bleeding-edge
releases) using `curl`:

```bash
curl -X POST http://localhost:3000/export \
  -H "Content-Type: application/json" \
  -d '{
        "projectName": "BlackRoadSandbox",
        "unityVersions": ["2022.3.10f1", "6000.0.4f1"],
        "renderPipeline": "urp",
        "template": "codex-prototype"
      }'
```

The response lists the generated zip archives under `downloads/`. Extract
both, open them in Unity Hub, and use the prompts in
`codex/prompts/blackroad_high_impact_codex_prompts.prompt.md` to drive rapid
scene authoring. Keeping two Unity versions handy ensures Codex output stays
compatible with production support needs and experimental research tracks.

## Auditing Historic Entries

Use the Codex audit helper to generate a quick report of every entry and
spot duplicated fingerprints left over from early experiments:

```bash
python3 codex/tools/codex_entries_audit.py
```

Pass `--format json` if you need machine-readable output for downstream
automation or dashboards.
