# Universal Quick Pulse (Emoji Edition)

Use: merges, test runs, setup work, or any change request.
Trigger: paste as a PR comment or description; tag your bots/teams up top.

@Copilot @BlackRoadTeam @Codex @Cadillac @Lucidia @Cecilia @blackboxprogramming

🟢🟢🟢🟢 ⚪️  | Progress meter (1–5)
- 0/5 ⚪️⚪️⚪️⚪️⚪️ — draft
- 1/5 🟢⚪️⚪️⚪️⚪️ — scoped
- 2/5 🟢🟢⚪️⚪️⚪️ — ready for review
- 3/5 🟢🟢🟢⚪️⚪️ — validated in CI
- 4/5 🟢🟢🟢🟢⚪️ — approved, queued to merge
- 5/5 🟢🟢🟢🟢🟢✅ — merged/deployed and monitored

### Quick Pulse
- **Context:** …(1 line on what this PR / request handles)
- **Scope/Impact:** (systems, endpoints, data, users)
- **Risk level:** 🟢 Low | 🟡 Medium | 🔴 High
- **Backout plan:** (how we safely revert if needed)

### Security sanity
- [ ] Secrets scrubbed (envs, logs, configs)
- [ ] Authn/Authz paths unchanged or re‑verified
- [ ] Data flows reviewed (PII/PCI/PHI?) + least‑privilege confirmed
- [ ] Dependency diffs reviewed (no surprise upgrades)

### Tests
- [ ] Unit ✅
- [ ] Integration ✅
- [ ] Auth/permission edge cases ✅
- [ ] Observability checks updated (logs/metrics/traces)

### Merge/Deploy plan
- [ ] Target branch: `main` | `release/*`
- [ ] Feature flag / gradual rollout noted
- [ ] Pre‑merge checklist passed (lint, typecheck, build, coverage gates)
- [ ] Reviewer sign‑off: @____
- [ ] Merge window: (UTC range)

--- 

### Optional Ops/Infra add‑on
- [ ] CI/CD path parity (dev/stage/prod)
- [ ] Infra drift check (IaC plan/apply reviewed)
- [ ] Telemetry watch (dashboards + alerts linked)
- [ ] Cost/limits snapshot (API quotas, egress, compute)

### Stakeholders
- **Owner:** @__  | **Reviewer:** @__  | **Approver:** @__  
- **Affected teams:** @__ @__  
- **Change window comms:** #channel / @pager‑rotation

### Self‑assessment (pick one)
- 🤓 I understand and can teach it
- 🙂 I can do it myself
- 😐 I’m close; want eyes on X
- 🙋 I don’t know yet — **looping in mentor @__** (no one left behind)
  - What I tried:
  - Where I’m stuck:
  - What I need:

### Post‑merge
- [ ] Smoke check passed
- [ ] Error budget OK
- [ ] User impact reviewed
- [ ] Docs updated (README/Runbook/Changelog)
- [ ] Close linked tickets

---

🧾 **HASH ID:** `<short SHA or ticket key>`  
🔗 **Links:** PR | CI run | Preview URL | Dashboards | Runbook  
🧠 **Summary:** …(2–3 lines)  
🛠 **Actions Taken:** …   
➡️ **Next Steps:** 1) … 2) … 3) …  

> Silence means go. If anyone spots drift, lag, or something off — flag here before merge.

---

## Automation hooks (optional, lightweight)

Use these as signals for Codex/Copilot/bots, or wire them into GitHub/ClickUp/CI without data silos.

### A) PR body guardrail (blocks merge if critical boxes aren’t ticked)

Add a status check via GitHub Action that fails when required checklist items aren’t checked in the PR body:

```
# .github/workflows/pulse-guard.yml
name: Quick Pulse Guard
on:
  pull_request:
    types: [opened, edited, synchronize]
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || "";
            const required = [
              "- [ ] Secrets scrubbed",
              "- [ ] Authn/Authz paths unchanged or re‑verified",
              "- [ ] Dependency diffs reviewed",
              "- [ ] Unit ✅",
              "- [ ] Integration ✅",
              "- [ ] Merge window:"
            ];
            const missing = required.filter(r => body.includes(r));
            // If any required lines are present but unchecked, fail:
            const unchecked = required.filter(item => body.includes(item));
            if (unchecked.length) {
              core.setFailed(`Missing or unchecked items: ${unchecked.join(" | ")}`);
            }
```

Tip: protect main to require this check. Change the required list to match your team’s non‑negotiables.

### B) Labels & routing (simple keyword → label)

Add labeler so your pulse sets labels automatically (e.g., Risk:High, Security, Infra):

```
# .github/labeler.yml
risk-high:
  - changed-files:
      - any-glob-to-any-file: ['**/*']
    label: 'Risk:High'
    body:
      - '/Risk level:\s*🔴/i'
security:
  - body:
      - '/Security sanity/i'
infra:
  - body:
      - '/Infra|IaC|drift/i'
```

Use actions/labeler@v5 in a workflow to apply these from PR body content.

### C) ClickUp link (no silo)
- Add the ClickUp–GitHub integration so mentioning CU-1234 in HASH ID auto‑links the PR to the task.
- Create a ClickUp automation: when a task status moves to In Review, post this template into the task comment and @‑mention the reviewer. When the GitHub PR merges, auto‑move the task to Monitoring.

### D) Slack/Teams pulse
- Post the Progress meter line and Summary to a change‑log channel via your CI on every PR edit.
  Trigger rule: body contains 🟢 meter + Merge/Deploy plan.

---

### Why this works
- Tight signal, low overhead. Everyone sees the same pulse, regardless of tool.
- Safety first. Secrets, auth, and dependencies are explicit; tests and observability are non‑skippable.
- Learning lane. The self‑assessment + mentor loop normalizes “I don’t know yet” and routes help fast.
- Ops‑ready. Optional block covers drift, parity, telemetry, and costs without bloating normal PRs.

If you want, I can follow this with Template #2 (smaller “single‑file change” variant) or a DMAIC‑flavored version for process fixes.
