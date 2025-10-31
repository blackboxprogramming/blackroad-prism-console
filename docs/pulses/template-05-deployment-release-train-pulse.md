# 📦 Deployment & Release Train Pulse

Use: recurring release cycles, coordinated multi-service deploys, feature-flag rollouts.  
Goal: keep every release consistent, documented, and reversible.

---

## 🧾 Header
- **HASH ID**: (release branch / ticket / CI pipeline ref)
- **Train Name**: v 2025.10-R1 (YYYY.MM-Rn format recommended)
- **Owner**: @__ | Release Mgr @__ | Approvers @__
- **Planned window**: __ UTC → __ UTC
- **Pulse**: 🟢🟢⚪️⚪️⚪️ (ready) → 🟢🟢🟢🟢🟢✅ (shipped)

---

## 🧭 Stage 1 — Pre-Flight (2-3 days before)
- Release notes drafted + linked to CHANGELOG
- Branch frozen and tagged (release/*)
- Regression suite ✅
- Dependencies locked (no shadow upgrades)
- Feature flags reviewed (on/off plan defined)
- Infra config diff reviewed (IaC plan applied)
- Rollback script/image tested and stored

---

## 🚀 Stage 2 — Go / No-Go Checklist (-30 min)

| Item | Owner | Status |
| --- | --- | --- |
| Stakeholders online in channel | @__ | ☐ |
| On-call rotation active | @__ | ☐ |
| Backups verified (timestamp) | @__ | ☐ |
| Monitoring muted only for expected noise | @__ | ☐ |
| Approval granted (emoji 🟩) |  | ☐ |

---

## 🧩 Stage 3 — Deploy
- Announce start (:rocket: message in #deploy-feed).
- CI/CD job triggered → green checks observed.
- Migrate DB (if needed) + record migration hash.
- Validate critical paths (login, payments, API pings).
- Update status page to “maintenance” then “operational.”
- Post “🟢 Live” confirmation with links to dashboards.

---

## 🧠 Stage 4 — Post-Deploy Validation
- Monitor KPIs (5xx rates, latency, user errors) for 1 hour.
- Collect alerts / anomalies into incident doc if any.
- Confirm expected feature-flag behaviour.
- Unmute monitors + close maintenance window.

---

## 🧾 Stage 5 — Close Out
- Tag final commit vX.Y.Z.
- Merge release branch → main.
- Publish release notes (link to artifact).
- Archive logs / artifacts to secure storage.
- Schedule retro (≤ 48 hrs).

---

## 🧩 Retro Prompts
- What went smoothly / roughly?
- Did tests match production reality?
- Any alerts we ignored that we shouldn’t have?
- One automation to add before next train?

---

## 🪶 Automation Hooks
- GitHub Action: label release-train → auto-post this template to PR.
- ClickUp: task status = “Ready to Deploy” → spawn subtasks for Pre-Flight items.
- Slack: /pulse-deploy → interactive checklist with 🟢 updates in #release-train.

---

## ✅ Completion Criteria
- Rollback window expired cleanly.
- Metrics stable 24 hrs.
- Retro logged and actions filed.
- Pulse meter 🟢🟢🟢🟢🟢✅.

---

Next candidate in the chain is Template #6 — “📈 Performance & Reliability Pulse” (the ongoing health-check companion to your release cycle) — or would you rather pivot to something human-side again (like team wellness / learning pulse)?
