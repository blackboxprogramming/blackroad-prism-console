# Template #11 — 🎨 Design Review & UX Handoff Pulse

**Use:** Before engineering starts, or when major UX/UI changes are ready for implementation.

**Goal:** Confirm designs are complete, consistent, accessible, and technically clear.

---

## 🧾 Header
- **HASH ID:** `(DESIGN-2025-###)`
- **Feature / Project:**
- **Designer:** `@__`  **Reviewer (Eng):** `@__`  **PM:** `@__`
- **Handoff Date:** `__`
- **Pulse:** `🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅`

---

## 🖼 Stage 1 — Scope & Context
- Linked to Feature Kickoff doc.
- Summary of what’s being designed (core user flow).
- Problem statement and intended outcome.
- User research / insights attached.
- Accessibility level targeted (AA / AAA).

> 🟡 *If any of the above are unclear, note “need confirmation from PM/UX research.”*

---

## 🧩 Stage 2 — Review Checklist

| Area | Criteria | Status | Owner |
| --- | --- | --- | --- |
| Layout & Spacing | Grid, spacing tokens, breakpoints consistent | ⚪️ | @__ |
| Components | Use of design system elements only | ⚪️ | @__ |
| Copy & Tone | Matches brand voice, localized text ready | ⚪️ | @__ |
| Accessibility | Color contrast, keyboard navigation, aria labels | ⚪️ | @__ |
| Prototype Behavior | Links & states accurately reflect flow | ⚪️ | @__ |
| Edge Cases | Errors, empty states, loading | ⚪️ | @__ |

---

## 🔍 Stage 3 — Cross-Functional Review
- PM confirms user stories & acceptance criteria match designs.
- Eng Lead reviews feasibility / estimates complexity.
- QA notes test data or edge cases early.
- Legal/Compliance review if required (data, copy, claims).
- Sign-off comments consolidated in Figma / Miro thread.

---

## 📦 Stage 4 — Handoff Package
- Exported assets (SVG/PNG) + specs (Zeplin/Figma Inspect).
- Component names match code repo naming.
- Variant states defined.
- Design tokens / theme variables linked.
- “Source of truth” Figma page tagged FINAL.
- Slack post: “Design ready for build 🟢” in `#dev-handoff`.

---

## 🧭 Stage 5 — Post-Handoff
- Engineering confirms receipt and setup.
- Any blockers fed back within 48 hrs.
- Add link to PR once implementation starts.
- Pulse updated to `🟢🟢🟢🟢🟢✅` when live in staging.

---

## 🪶 Automation Hooks
- ClickUp: Label `design-review` → generate this checklist.
- Figma Plugin: `/pulse-handoff` posts summary to Slack.
- GitHub: add `design-approved` label to mark readiness for dev branch.

---

## ✅ Completion Criteria
- All review checklist items complete.
- Final design file version locked.
- Engineers confirm clarity; QA prepared tests.
- Pulse `🟢🟢🟢🟢🟢✅`.

---

**Next up:** Template #12 — 🧪 QA Verification & Testing Pulse picks up the handoff baton for test coverage, automation, and sign-off. Ready to roll into that one?
