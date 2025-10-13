# Template #18 — 🧭 Governance & Compliance Pulse

**Use:** Quarterly or annual audit prep, policy reviews, SOC 2 / GDPR / HIPAA readiness checks.

**Goal:** Verify that what’s documented is real, that access is least-privilege, and that risks are logged instead of hidden.

---

## 🧾 Header
- **HASH ID:** `(GOV-2025-##)`
- **Domain:** `Security | Privacy | Finance | HR | Ops`
- **Compliance Lead:** `@__`  **Auditor:** `@__`  **Sponsor:** `@__`
- **Cycle:** `Q__`  **Review Window:** `__ → __`
- **Pulse:** `🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅`

---

## 📋 Stage 1 — Policy Review

| Policy | Owner | Last Updated | Gaps Found | Notes |
| --- | --- | --- | --- | --- |
| Data Retention | @__ |  |  |  |
| Incident Response | @__ |  |  |  |
| Access Control | @__ |  |  |  |
| Vendor Management | @__ |  |  |  |

- Confirm every policy is version-controlled.
- Cross-check signatures / acknowledgements from staff.
- Archive obsolete or duplicate documents.

> 🟡 *If unclear: “I don’t know yet — need confirmation from @__.”*

---

## 🔐 Stage 2 — Access & Permissions
- Review admin / root accounts across systems.
- Run least-privilege audit: no shared creds, no stale accounts.
- MFA enforced ≥ 95%.
- Logs retained ≥ 90 days and searchable.
- Confirm offboarding process tested with dummy user.

---

## 🧾 Stage 3 — Risk Register & Controls

| Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

- Update control IDs and status (operational / planned / retired).
- Link each control to evidence (screenshot, audit log, ticket).
- Escalate red risks to governance board.

---

## 🧠 Stage 4 — Audit Prep / Evidence
- Centralize artifacts in shared secure folder.
- Verify naming conventions and timestamps.
- Run mock audit (spot check 5 controls).
- Document non-conformities + corrective actions.
- Sign management attestation for this cycle.

---

## 🗣 Stage 5 — Reporting & Communication
- Summarize findings by risk category (red/yellow/green).
- Share report with exec team and relevant auditors.
- Publish “lessons and improvements” internally.
- Update calendar for next governance window.

---

## 🪶 Automation Hooks
- ClickUp: Label `compliance-review` → spawn this checklist with owners.
- Slack: `/pulse-gov` posts open risks table to `#compliance`.
- GitHub: merge to `policy-main` triggers auto-update to evidence log.

---

## ✅ Completion Criteria
- All policies reviewed and acknowledged.
- Risk register updated with evidence.
- Audit materials centralized and secure.
- Next cycle scheduled.
- Pulse `🟢🟢🟢🟢🟢✅`.

---

**Next in line:** Template #19 — 🤝 Vendor & Third-Party Management Pulse — the outward-facing twin of governance that tracks integrations, suppliers, and partner risk. Keep going?
