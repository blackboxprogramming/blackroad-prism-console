# 🟢🟢🟢🟢 ⚪️ Quick Pulse — Merge/Test/Setup

**HASH ID**: <!-- e.g., BR-2025-0012 | JIRA-123 | CU-abc123 -->
**Context**: <!-- 1 line: what/why -->
**Scope**: <!-- services, modules, infra -->

## 🔐 Security sanity
- [ ] No secrets in code/logs/configs
- [ ] Least-privilege access in agents/pipelines
- [ ] SBOM/deps reviewed; issues triaged

## 🧪 Tests
- [ ] All suites green (link to run)
- [ ] Auth/perm edge cases covered
- [ ] Rollback path described

## 🔀 Merge plan
- [ ] Change size/blast radius acknowledged
- [ ] Sequence: migrations/flags → deploy → post-checks
- [ ] Approvals gathered; freeze windows honored

## 🛠 Optional Ops/Infra add-on
- [ ] CI/CD env parity verified
- [ ] Dependency freeze/lockfile stable
- [ ] Telemetry watch set (links)

## 📋 Actions Taken
- …

## ⏭️ Next Steps
- …

## 📈 Rollup
**Risk**: ☐ low ☐ med ☐ high  |  **Impact**: ☐ user-visible ☐ data  
**Go window**: …

<details>
<summary>Explain this</summary>

- **Least-privilege** – Only grant the minimal rights required for the task.
- **Rollback path** – Document the exact command, feature flag, or image tag used to undo.
- **Telemetry watch** – Note which dashboards, alerts, or logs you will monitor post-ship.
- **Go window** – Identify when the final go/no-go call will be made.

</details>

If you’re unsure, write “I don’t know yet — need a hand with <X>” and @tag your teacher.
