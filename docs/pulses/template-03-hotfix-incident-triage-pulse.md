# ⚡ Hotfix & Incident Triage Pulse

**Use:** Any unplanned outage, deployment rollback, or critical bug.

**Purpose:** Capture facts fast, restore service, and log learning before the trail goes cold.

---

## 🧾 Header
- **HASH ID:** _(incident / PR / ticket ref)_
- **Reported at:**
- **Detected by:**
- **Severity:** 🔴 Blocker | 🟠 High | 🟡 Medium | 🟢 Low
- **Pulse status:** 🟢🟢⚪️⚪️⚪️ _(initial)_ → 🟢🟢🟢🟢🟢✅ _(resolved)_

---

## 🚨 Stage 1 — Detection
- Confirm the issue exists (replicate or observe).
- Capture logs, error IDs, commit hash, environment.
- Tag responders in ClickUp/Jira/Slack.
- Start a timestamped “incident thread” in the main channel.

> 🟡 **If uncertain:** Note “I don’t know yet — need eyes on `system/service`” and tag the relevant SME.

---

## 🧯 Stage 2 — Contain & Mitigate
- Disable or rollback the faulty deploy.
- Gate new traffic if required (feature flag / load balancer).
- Verify impact scope (users, data, integrations).
- Post first public/internal update (<15 min).
- Assign a single communication owner.

---

## 🔍 Stage 3 — Root Cause & Repair
- Identify last known good state (commit / config).
- Pair review of relevant logs + code diffs.
- Patch / hotfix committed & tested in staging.
- CI pipeline green.
- Deploy to prod after approval + check telemetry.

---

## 🧾 Stage 4 — Post-Resolution
- Validate system stability for 24 hrs.
- Update documentation / runbooks.
- Add regression test.
- Schedule post-mortem (≤ 48 hrs).
- Notify affected stakeholders that closure is confirmed.

---

## 🧠 Post-Mortem Mini-Template

| Section | Prompt |
| --- | --- |
| **Summary** | One-line plain-speak description. |
| **Timeline** | Detection → Response → Fix → Restore. |
| **Root cause** | Human + technical factors. |
| **What worked** | Fast detection, solid comms, prior automation, etc. |
| **What failed** | Missed alert, unclear ownership, etc. |
| **Prevent repeat** | Code / process / automation changes. |

---

## 🪶 Automation Hooks
- **GitHub Actions:** On failed CI ×2, auto-create “Hotfix Pulse” issue from this template.
- **ClickUp:** Trigger when task label = “incident”; auto-assign @Ops Lead and spin up subtasks (Contain / Repair / Review).
- **Slack:** `/pulse-hotfix` command posts live checklist thread.

---

## ✅ Completion Criteria
- Service metrics normal.
- Fix merged, verified, and deployed.
- Post-mortem logged and shared.
- Learnings + actions entered into the knowledge base.
- Pulse meter shows 🟢🟢🟢🟢🟢✅.

---

**Next up:** Template #4 — “🔒 Security Sweep / Vulnerability Patch Pulse,” unless you’d rather pivot into a non-engineering lane (e.g., design review, mentorship feedback). Pick the next track when ready.
