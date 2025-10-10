# Template #2 — "Ops & Flow Diagnostic Pulse"

Use this template when a project, workflow, or system starts slowing down, drifting, or breaking pattern.
Purpose: isolate friction points, document ownership, and reset momentum before escalation or burnout.

---

## 🧾 Diagnostic Header
- **HASH ID:** (link to ClickUp/Jira ticket or GitHub issue)
- **Date range reviewed:**
- **Ops lead:**
- **Supporting systems:** (e.g., ClickUp | Monday | GitHub | Zapier | Slack)
- **Current pulse:** 🟢🟢⚪️⚪️⚪️ (fill per phase)

---

## ⚙️ Context

What’s showing strain? (summarize in 1–2 sentences)

- Lag or backlog identified
- Ownership or access confusion
- System rule drift (e.g., notifications, automations, triggers out of sync)
- Cross-team dependency blocked
- Unclear source of truth

---

## 🧩 System Review Checklist

| Area | Status | Notes / Fix |
| --- | --- | --- |
| 🔄 Automations running as expected | ☐ / 🟢 / 🔴 | |
| 🔐 Permissions + roles correct | ☐ / 🟢 / 🔴 | |
| 📡 Integrations stable (Zapier, Make, API) | ☐ / 🟢 / 🔴 | |
| 🧮 Data hygiene (naming, tags, duplicates) | ☐ / 🟢 / 🔴 | |
| 🧠 Templates current (no outdated subtasks) | ☐ / 🟢 / 🔴 | |
| 🧍‍♀️ Ownership clear per status | ☐ / 🟢 / 🔴 | |
| 💬 Communication loop working (Slack/Email) | ☐ / 🟢 / 🔴 | |
| ⏱ Cycle time within range | ☐ / 🟢 / 🔴 | |

---

## 🧭 Actions Taken
1.
2.
3.

### ⏭️ Next Steps
1.
2.
3.

---

## 🧠 Reflection Prompts (Use in Retro)
- What slipped through the cracks?
- What signal showed earliest that friction was building?
- Was the data there to catch it sooner?
- What rule/process needs revision or automation to prevent recurrence?

---

## 🪶 Integration Hooks
- **ClickUp:** Create automation “If Status = Blocked > Trigger ‘Ops Diagnostic’ Subtask + Assign to Ops Lead.”
- **GitHub:** Label automation `needs-ops-diagnostic` to auto-generate this template as a comment.
- **Slack:** `/pulse-diagnostic` command posts template block into `#ops-support` channel.

---

## 🔁 Completion Criteria

✅ All status boxes reviewed  
✅ Actions logged and assigned  
✅ Friction origin identified  
✅ Follow-up tasks created in system of record  
✅ Pulse meter green for 2 consecutive days

---

> Would you like this rolled into the automated progress-tracking sequence so it fires whenever a ticket sits idle for >5 days or a PR build fails twice?
