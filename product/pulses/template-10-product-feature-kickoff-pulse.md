# 🧭 Product & Feature Kickoff Pulse

**Use:** at the very start of a project or major feature.
**Goal:** frame intent, reduce unknowns, and make sure everyone knows what “done” and “not-yet” look like.

---

## 🧾 Header
- **HASH ID:** (FEATURE-2025-###)
- **Feature / Project Name:**
- **Owner:** @__  **PM:** @__  **Design:** @__  **Eng Lead:** @__
- **Kickoff Date:** __  **Target Ship:** __
- **Pulse:** 🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅

---

## 🎯 Stage 1 — Context & Intent
- Problem statement (in one tweet length).
- Why this now — link to metrics or user feedback.
- Who benefits (primary persona).
- Definition of Success (KPIs / acceptance criteria).
- Definition of Done (functional + non-functional).

> 🟡 *If unclear:* “I don’t know yet — need input from __.”

---

## 🧩 Stage 2 — Scope & Assumptions

| Area          | Assumption | Risk Level | Mitigation |
|---------------|------------|------------|------------|
| Tech          |            | 🟢/🟡/🔴    |            |
| Design        |            |            |            |
| User Research |            |            |            |
| Data / Privacy |           |            |            |

- Dependencies listed (other teams or systems).
- Feature flags plan (rollout / rollback).

---

## 🧠 Stage 3 — Plan & Milestones

| Milestone              | Owner | Due | Status |
|------------------------|-------|-----|--------|
| Design Spec Approved   |       |     | ⚪️     |
| Prototype / POC        |       |     | ⚪️     |
| Dev Complete           |       |     | ⚪️     |
| Testing / QA           |       |     | ⚪️     |
| Release Candidate      |       |     | ⚪️     |

---

## 💬 Stage 4 — Comms & Alignment
- Kickoff meeting scheduled (+ recorded).
- Project page created (ClickUp / Notion / Confluence).
- Slack channel `#feature-___` set up.
- Weekly update ritual decided (owner + day).

---

## 🪴 Stage 5 — After Kickoff
- Add feature to roadmap view with emoji 🧭.
- Track open questions / “unknown unknowns.”
- Schedule mid-point review.
- Mark pulse 🟢🟢🟢 once build starts.

---

## 🪶 Automation Hooks
- ClickUp: When status = “Planned” → spawn Kickoff Pulse subtasks.
- GitHub Projects: Label kickoff → auto-create issue with this template.
- Slack: `/pulse-kickoff` → drops Stage 1 checklist into channel thread.

---

## ✅ Completion Criteria
- Team aligned on problem, scope, and success.
- Risks and dependencies logged.
- Owners and deadlines set.
- Kickoff record linked to project hub.
- Pulse 🟢🟢🟢🟢🟢✅.

---

*Next in the progression is Template #11 — 🎨 Design Review & UX Handoff Pulse, which pairs naturally after kickoff and before the dev train leaves the station.*
