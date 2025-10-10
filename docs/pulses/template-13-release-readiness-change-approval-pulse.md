# Template #13 — 🚢 Release Readiness & Change Approval Pulse

**Use:** before pushing code or configuration to production.
**Goal:** align QA, security, infra, and business on a single, documented go-decision.

---

## 🧾 Header
- **HASH ID:** (RELREADY-2025-##)
- **Release / Feature:**
- **Release Manager:** @__  **QA Lead:** @__  **Security:** @__  **Stakeholders:** @__
- **Target window:** __ UTC
- **Pulse:** 🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅

---

## 📋 Stage 1 — Verification Summary
- QA checklist complete and green ✅
- Security sweep complete, no critical CVEs remaining
- Performance metrics within thresholds
- Dependencies locked / reproducible build hash recorded
- Rollback plan verified and tested
- Release notes drafted + approved

---

## 🧩 Stage 2 — Change Review

| Area | Owner | Risk | Status | Notes |
| --- | --- | --- | --- | --- |
| Code | @__ | 🟢/🟡/🔴 | ⚪️ | |
| Config / Infra | @__ | 🟢/🟡/🔴 | ⚪️ | |
| Database / Schema | @__ | 🟢/🟡/🔴 | ⚪️ | |
| Third-Party Integrations | @__ | 🟢/🟡/🔴 | ⚪️ | |
| Communication / Docs | @__ | 🟢/🟡/🔴 | ⚪️ | |

> 🟡 If any item uncertain: note “I don’t know yet — need input from __.”

---

## 🔐 Stage 3 — Approval Matrix

| Role | Name | Decision | Timestamp |
| --- | --- | --- | --- |
| QA Lead | | ✅ | |
| Security | | ✅ | |
| Product / PM | | ✅ | |
| Engineering Manager | | ✅ | |
| Executive / Owner | | ✅ | |

_When all approvals in, change record tagged “Ready to Release 🟢.”_

---

## 📢 Stage 4 — Comms & Coordination
- Slack channel #release-train announced w/ schedule
- Status page updated with maintenance window
- Customer-facing comms drafted (release notes / support scripts)
- On-call roster confirmed
- Go/No-Go meeting scheduled (< 15 min stand-up)

---

## 🧭 Stage 5 — Go Decision

At Go-NoGo:
- If ✅ all green → deploy.
- If 🟡 partials → mitigation plan logged + deferred items listed.
- If 🔴 any critical risk → reschedule and document reason.

---

## 🪶 Automation Hooks
- GitHub: Label release-candidate triggers this checklist in issue comments.
- ClickUp: status “QA Passed” → auto-spawn Release Readiness subtasks.
- Slack: /pulse-release posts live approval table + emoji buttons for sign-off.

---

## ✅ Completion Criteria
- All required approvals recorded.
- Risks documented and mitigated.
- Communication sent to stakeholders.
- Deployment authorized.
- Pulse 🟢🟢🟢🟢🟢✅.

---

**Next up:** Template #14 — 📢 Post-Launch Monitoring & Comms Pulse — the calm-after-launch pattern for watching metrics and looping back learnings.
