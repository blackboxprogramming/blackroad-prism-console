# Template #14 — 📢 Post-Launch Monitoring & Comms Pulse

**Use:** Immediately after a release or migration.

**Goal:** Confirm stability, communicate clearly, and collect insights before they vanish.

---

## 🧾 Header
- **HASH ID:** `(POSTREL-2025-##)`
- **Release / Feature:**
- **Owner:** `@__`  **Support:** `@__`  **Comms:** `@__`
- **Start:** `__`  **End:** `__`
- **Pulse:** `🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅`

---

## ⏱ Stage 1 — Live Watch (0-24 hrs)
- Error and latency dashboards pinned on screen.
- Pager alerts verified and muted only for expected noise.
- Check database health, job queues, cache hit rate.
- Validate tracking / analytics events firing.
- Monitor customer channels for new bug chatter.
- Keep a real-time log of anomalies (link to ClickUp or Notion).

> 🟡 *If any metric feels off: “I don’t know yet — need eyes on ” → tag responsible owner.*

---

## 📊 Stage 2 — Early Feedback

| Source | Signal | Owner | Action |
| --- | --- | --- | --- |
| Support tickets |  | @__ |  |
| Social / community |  | @__ |  |
| Internal users |  | @__ |  |
| Monitoring alerts |  | @__ |  |

- Triaged feedback labeled post-launch.
- Priority issues converted into bug or task cards.

---

## 💬 Stage 3 — Communication
- Public changelog updated.
- Internal “what shipped” note posted (#announcements).
- Customer-facing email or blog queued if relevant.
- Acknowledge any visible issues transparently (“known issue, fix incoming”).
- Capture FAQ responses for Support scripts.

---

## 🧭 Stage 4 — Review & Stabilize (24-72 hrs)
- Compare key metrics to baseline (traffic, errors, revenue).
- Confirm no new alerts in 48 hrs.
- Verify rollbacks not required.
- Re-enable normal alerting thresholds.
- Schedule short retro if anomalies > threshold.

---

## 🪶 Automation Hooks
- GitHub: merge to main with tag → open “Post-Launch Pulse” issue.
- ClickUp: status “Released” → spawn Live Watch checklist for 24-hour window.
- Slack: `/pulse-post` posts dashboard links + anomaly log template.

---

## ✅ Completion Criteria
- All metrics stable for 72 hrs.
- User and internal comms complete.
- Learnings captured for next release.
- Pulse `🟢🟢🟢🟢🟢✅`.

---

**Next in line:** Template #15 — 🧾 Retrospective + Continuous Improvement Pulse, where the team wraps the cycle, extracts learnings, and turns them into process upgrades instead of guilt trips. Want me to roll into that?
