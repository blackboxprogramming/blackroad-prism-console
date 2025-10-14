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
workflows.  The new **BlackRoad pipeline** script provides a single entry
point for pushing code through GitHub and into the BlackRoad.io
deployment.  It currently focuses on scaffolding the pipeline with clear
extension points for future integrations.
| ID  | Title                   | Description                                          |
| --- | ----------------------- | ---------------------------------------------------- |
| 001 | The First Principle     | Lucidia exists to protect and empower everyone.      |
| 003 | The Workflow Circle     | Work runs in visible capture → adjust loops.         |
| 004 | The Autonomy Manifest   | Data autonomy through consent, export, and wipe.     |
| 022 | The Security Spine      | Security backbone with layered zero-trust defenses.  |
| 028 | The Custodianship Code  | Stewardship keeps Lucidia tended, transparent, safe. |
| 033 | The Wholeness Rule      | People remain whole; balance is built into Lucidia.  |
| 027 | The Integrity Pact     | Honest metrics, transparent reporting, visible corrections. |
| 031 | The Silence Accord     | Silence respected as an intentional, user-led state. |
| 028 | The Custodianship Code | Custodial stewardship over ownership and power. |
| 034 | The Humility Clause    | Confidence with limits, always signaling uncertainty. |
| 018 | The Memory Covenant    | Memory stays purposeful, finite, and revocable. |
| 020 | The Governance Charter | Transparent RFC-led decisions with recorded votes. |
| 015 | The Trust Ledger       | Trust is tracked via a public reliability ledger. |
| 007 | The Resilience Code    | Failure is expected; recovery keeps service live. |
| 045 | The Compassion Rule    | Compassion guides every response to conflict.   |
| 041 | The Restraint Principle | Restraint on data, models, features, and kill switches. |

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

## Codex Agent ("next" trigger watcher)

The `codex/tools/codex-agent.sh` helper can run on a Raspberry Pi (or any
Linux box) to watch for a `next` flag, perform a safe set of diagnostics
and fallbacks, and optionally ping a remote webhook so you know the
automation fired.

```bash
# 1. Configure callback / state locations if needed.
export PINGBACK_URL="https://your-server.example.com/codex-agent/ping"
export STATE_FILE="/tmp/codex_agent_state"

# 2. Launch the agent (consider using tmux/systemd for persistence).
sudo ./codex/tools/codex-agent.sh

# 3. Trigger from another session when you're ready.
echo next | sudo tee "$STATE_FILE"
```

Environment variables let you customize behaviour:

| Variable             | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `PINGBACK_URL`       | Optional webhook endpoint that receives a JSON payload.      |
| `STATE_FILE`         | File to watch for the `next` token (defaults to `/tmp/...`). |
| `NEXT_TOKEN`         | Override the trigger word if you prefer something else.      |
| `REBOOT_ON_TRIGGER`  | Set to `false` to skip the automatic reboot step.            |
| `MAX_DIAG_LINES`     | Trim diagnostic payload size (defaults to 100 lines).        |

When a trigger is detected the agent:

1. Clears the state file so subsequent triggers work immediately.
2. Captures diagnostics (kernel version, `vcgencmd` data, block devices).
3. Ensures `config.txt` contains USB power and HDMI safe overrides.
4. Posts the diagnostic snippet to your webhook (when configured).
5. Reboots (unless `REBOOT_ON_TRIGGER=false`).

_Last updated on 2025-09-11_

## Auditing Historic Entries

Use the Codex audit helper to generate a quick report of every entry and
spot duplicated fingerprints left over from early experiments:

```bash
python3 codex/tools/codex_entries_audit.py
```

Pass `--format json` if you need machine-readable output for downstream
automation or dashboards.
