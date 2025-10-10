# Quick Pulse Operations Pack

The Quick Pulse playbook keeps merge, test, and setup conversations aligned across tools. This page is the source of truth for the comment template, PR checklist, and supporting glossary.

## Copy/Paste Comment Template

Use this snippet in pull requests, tasks, tickets, or chats whenever you need to coordinate a merge/test/setup conversation. Tag the right folks and fill in the placeholders before sharing.

````markdown
🟢🟢🟢🟢 ⚪️  |  Quick Pulse — before we move

🧾 HASH ID: <system-agnostic ID, e.g., BR-2025-0012 | JIRA-123 | CU-abc123>  
🔎 Context (1-liner): <what this PR/request handles>  
📌 Scope: <code/services/infra touched>  
👥 Owners: <DRI> | Reviewers: <names> | Stakeholders: <names>  

🔐 Security sanity
- [ ] Secrets: no creds/tokens in code/logs/configs
- [ ] Permissions: least-privilege confirmed (service, pipeline, IAM)
- [ ] SBOM/deps: reviewed (flags handled or waived)

🧪 Tests
- [ ] Suites re-run, green on main + branch
- [ ] Auth/permissions edge cases exercised
- [ ] Rollback path validated (how to undo)

🔀 Merge plan
- [ ] Change size & blast radius acknowledged
- [ ] Order of ops: <migrations/feature flags/infra> → <deploy> → <post-checks>
- [ ] Approval: reviewers signed off; freeze windows respected

🛠 Optional Ops/Infra add-on
- [ ] CI/CD parity: test/stage/prod env vars + pathing align
- [ ] Dependency freeze: no surprise upgrades
- [ ] Telemetry watch: dashboards/alerts pinned for first deploy window

📋 Actions Taken
1) …
2) …

⏭️ Next Steps
1) …
2) …

📈 Rollup
- Risks: <none/low/medium/high> ; Mitigations: <…>
- Impact: user-visible? data-touching? migration?
- Go/No-Go window: <timeframe>

🗣️ Flags & Help
If you’re unsure, write “I don’t know yet — need a hand with <X>” and tag the person who can teach it. Silence ≙ go.

Progress meter legend  
⚪️⚪️⚪️⚪️⚪️ not started → 🟢🟢🟢🟢🟢 ready → ✅📋 merged & logged.
````

## Pull Request Template

The Quick Pulse PR template lives at `.github/PULL_REQUEST_TEMPLATE/pulse.md`. It mirrors the comment template so status stays consistent across tools. See the next section for a copy and glossary links.

## Glossary & Plain Language Footnotes

- **Least-privilege access** – Give each system or person only the minimum permissions required to perform the work.
- **Rollback path** – Spell out exactly how to undo the change (for example, `git revert <commit>` or toggling a feature flag).
- **Telemetry watch** – Identify the dashboards, alerts, or logs you will monitor during the first deploy window.
- **Go/No-Go window** – The time range when you plan to make the final decision to ship or hold the change.

Keep this page updated as new roles, tools, or policies join the Quick Pulse workflow.
