# Template #12 — 🧪 QA Verification & Testing Pulse

**Use:** before merge, release, or after a hotfix.  
**Goal:** prove what’s built behaves as promised — across browsers, devices, and APIs — with minimal noise and maximum clarity.

---

## 🧾 Header
- **HASH ID:** (QA-2025-###)
- **Feature / Release:**
- **QA Lead:** @__  **Eng Contact:** @__  **PM:** @__
- **Test Window:** __ → __
- **Pulse:** 🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅

---

## 🧩 Stage 1 — Test Plan Prep
- Link to Feature / Kickoff / Design docs.
- Review acceptance criteria + edge cases.
- Define environments (staging, test, prod-sim).
- Confirm test data and credentials available.
- Identify automation coverage vs manual scope.
- Tag risk level: 🟢 Low | 🟡 Med | 🔴 High.

---

## 🧪 Stage 2 — Execute Tests

| Type | Tool | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| Unit | Jest / Pytest / etc | @__ | ⚪️ | |
| Integration | Postman / Cypress | @__ | ⚪️ | |
| E2E | Playwright / Selenium | @__ | ⚪️ | |
| Cross-Browser / Device | BrowserStack / Manual | @__ | ⚪️ | |
| Accessibility | axe / Lighthouse | @__ | ⚪️ | |
| Performance | k6 / WebPageTest | @__ | ⚪️ | |

---

## 📊 Stage 3 — Results & Defects
- Log all issues in tracker with severity + repro steps.
- Re-test fixed items; mark verified.
- Summarize pass/fail counts.
- Capture screenshots or videos for complex flows.
- Note any known issues deferred to next sprint.

---

## 🧭 Stage 4 — Sign-Off
- QA lead confirms acceptance criteria met.
- PM reviews and approves release readiness.
- Eng lead validates no open blockers.
- CI/CD pipeline green on merge branch.
- “Ready for Release 🟢” posted in #release-train.

---

## 🧠 Stage 5 — Post-Release Check
- Smoke test in production immediately after deploy.
- Compare staging vs prod metrics (error rate, load).
- Record any post-release fixes.
- Update regression suite with new tests.

---

## 🪶 Automation Hooks
- GitHub Actions: on PR labeled needs-QA, comment with this template.
- ClickUp: task status → “QA Ready” auto-creates subtasks for Stage 2.
- Slack: /pulse-qa posts live pass/fail summary in #qa-channel.

---

## ✅ Completion Criteria
- All tests executed + results logged.
- Critical issues closed or deferred with sign-off.
- Regression updated.
- Pulse 🟢🟢🟢🟢🟢✅.

---

**Next up:** Template #13 — 🚢 Release Readiness & Change Approval Pulse, the governance layer that bundles QA results, security, and stakeholder sign-off before the green-button moment.
