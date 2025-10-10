# BlackRoad Academy

BlackRoad Academy is the living enablement system that keeps delivery, safety, and craft sharp without depending on meetings. Use this playbook to stand up the Notion (or PRISM Hub Learn) space, automate enrollment, and keep the content fresh.

## 1. Structure

Create the space with the following hierarchy. Each page or module should host Looms, slides, runbooks, and embedded dashboards where relevant.

```
BlackRoad Academy
 ├─ Foundations
 │   ├─ How we build (cadence, 10-min builds, flags)
 │   ├─ How we ship (Go/No-Go, ladder, rollback)
 │   ├─ How we learn (post-mortems, release retros)
 ├─ Discipline Tracks
 │   ├─ Engineering (API, Infra, Ingest)
 │   ├─ Product / UX
 │   ├─ Data / AI
 │   ├─ Security / Governance
 ├─ Tool Stack (short videos)
 │   ├─ GitHub → Release flow
 │   ├─ Asana → Sprints / Releases
 │   ├─ Grafana / SLO dashboards
 │   ├─ Flags Admin
 ├─ Live Drills & Exercises
 │   ├─ Incident T-15
 │   ├─ Canary failure
 │   ├─ Data freshness
 │   ├─ Access review dry-run
 └─ Certification
     ├─ Level 1 (Contributor)
     ├─ Level 2 (Maintainer)
     └─ Level 3 (Operator)
```

### Page build notes
- **Foundations**: bundle the onboarding Loom, the shipping ladder diagram, the rollback checklist, and the post-mortem template. Include the quiz (see §3) using Notion databases or PRISM quiz blocks.
- **Discipline tracks**: each sub-track houses discipline-specific drop-in modules, linked runbooks, and hands-on labs. Tag each module with estimated time and refresh cadence.
- **Tool Stack**: record sub-10-minute walkthroughs showing the exact workflow. Embed GitHub projects, Asana boards, Grafana dashboards, and Flag Admin screenshots.
- **Live Drills & Exercises**: store drill scripts, success criteria, comms templates, and evidence upload dropbox.
- **Certification**: maintain a synced database (see §4) with requirements, status automation, and access privileges.

## 2. Delivery Rhythm

| Cadence   | Content                                             | Owner   |
|-----------|------------------------------------------------------|---------|
| Weekly    | 10-min async "Ops Pulse" (video + Notion summary)    | Ops     |
| Monthly   | One live drill (incident / rollback / data)          | Rotating lead |
| Quarterly | Access review retro + risk refresh                   | Security |
| Bi-annual | SOC2 refresh + DR restore test                       | Infra   |

Automate reminders in Asana (see §8) and surface the calendar in the Academy home page.

## 3. Academy Modules (Drop-ins)

### 🧭 Foundations: How We Ship Safely
- **Loom (≈8 min)** covering:
  1. CI green ≤ 10 min.
  2. Go/No-Go → Canary ladder → Verify → Promote.
  3. Rollback checklist.
  4. Flags 1 → 5 → 25 → 100.
  5. Post-mortems: 3 facts, 3 fixes, 1 owner.
- **Quiz (5 questions)**:
  - What does the ladder soak check?
  - What’s the kill-switch path for a bad flag?
  - When do you update status.blackroad.io?
  - How long do we keep incident evidence?
  - What is the 10-min build rule for?

### ⚙️ Engineering Track
- API tracing 101 (OTel instrumentation lab).
- Terraform guardrails (OPA policies walkthrough).
- Canary metrics (Grafana panel walkthrough + alert tuning).
- DR simulation (restore RDS snapshot to staging runbook).

### 🎨 Product / UX Track
- Flags → progressive exposure → feedback loops.
- Accessibility checklist (contrast, keyboard navigation, assistive tech verification).
- Empty-state language guide (tone + action patterns).
- Privacy by design (no prod data in dev environments).

### 📊 Data / AI Track
- dbt build → freshness tests → dashboard verification.
- Source connectors (GitHub, Linear, Stripe) setup and monitoring.
- How to check data lag and fix it (alerts + backfill script).
- AI-assisted features → review policy (human-in-loop checkpoints).

### 🔐 Security / Governance Track
- SOC2 quick map (how our controls align).
- Access review job & evidence pack walkthrough.
- Incident comms template exercise.
- Vendor onboarding (Airtable process + required docs).

## 4. Automate Enrollment & Refresh

- **GitHub → Academy**:
  - On repo join, send Slack DM: “Welcome to BlackRoad — start with Foundations (10 min).”
  - Trigger Notion (or PRISM) API to mark the Foundations module as assigned.
- **Asana Integration**:
  - Create recurring tasks: “Review Academy modules due for refresh (quarterly).”
  - “Update quiz questions (semi-annual).”
- **Tracking Database (Notion or Airtable)** fields: Name, Role, Modules Completed, Last Refresh, Cert Level, Next Drill.
- Sync completion states back to GitHub teams for CODEOWNERS automation (see §10).

## 5. Certification Tiers

| Level | Requirement                                      | Access                               |
|-------|--------------------------------------------------|--------------------------------------|
| 1 – Contributor | Foundations quiz, 1 drill participation       | Merge rights (non-prod)              |
| 2 – Maintainer  | 3 discipline modules, 2 drills               | Prod deploy, feature flag edit       |
| 3 – Operator    | All modules, lead 1 drill, SOC2 refresher    | Approve Go/No-Go, on-call rotation   |

Auto-upgrade access through IAM workflows tied to the tracking database.

## 6. “Ops Pulse” Template

- **Format**: 10-minute Loom + Notion entry stored in an “Ops Pulse” database.
- **Title**: `This week in BlackRoad (YYYY-MM-DD)`
- **Sections**:
  - *Highlights*: Release X shipped (link), New guardrail added, SLOs snapshot (availability, p95 latency, 5xx rate).
  - *Learning*: What failed, what fixed.
  - *Next Drill*: Date/time + link to drill runbook.
- **Distribution**: Post the summary in `#eng`, archive in Notion, and tag owners who owe follow-ups.

## 7. Live Drills

Maintain a quarterly rotation and log evidence (start/stop, owners, duration, lessons) in the drills database.

1. Incident drill: break staging → rollback → comms → post-mortem.
2. Data drill: pause a connector → detect lag → fix → dbt rebuild.
3. Security drill: expired token → detect via alarm → rotate → verify.
4. DR drill: restore snapshot → health check + failover validation.

## 8. Asana Tasks (Academy Rollout)

Import the following CSV (or create tasks manually) to track launch work.

| Task Name | Description | Assignee Email | Section | Due Date |
|-----------|-------------|----------------|---------|----------|
| Academy space | Create Notion “BlackRoad Academy” with structure & tracks. | amundsonalexa@gmail.com | Today | 2025-10-28 |
| Foundations module | Record Loom on shipping workflow + quiz. | amundsonalexa@gmail.com | Today | 2025-10-28 |
| Engineering track | Add OTel/Canary/DR lessons + quiz. | amundsonalexa@gmail.com | This Week | 2025-10-29 |
| Ops Pulse workflow | Create weekly template + schedule Slack post job. | amundsonalexa@gmail.com | This Week | 2025-10-29 |
| Drill rotation | Add quarterly drills to Asana recurring tasks. | amundsonalexa@gmail.com | This Week | 2025-10-30 |
| Certification table | Build Notion DB (Name, Role, Modules, Last Refresh, Level). | amundsonalexa@gmail.com | This Week | 2025-10-30 |

## 9. Slack Blurbs

**#eng**
```
BlackRoad Academy is live 🎓
- 10-min Foundations video → required for all new contributors
- Track-specific modules (Eng, Product, Data, Security)
- Ops Pulse weekly digest in this channel
- First live drill Friday: staged incident rollback
```

**#announcements**
```
We’re baking learning into the workflow:
- Short modules, no meetings
- Drills replace chaos
- Certifications map to real privileges (Contributor → Operator)

Foundations due by Friday. Everything’s in Notion › BlackRoad Academy.
```

## 10. Optional Automations (Next)

- Slack slash command `/academy progress` → returns your modules + next drill.
- GitHub Action that checks for “Foundations complete” before adding to CODEOWNERS.
- AI summarizer that turns weekly Ops Pulse into 3-line Slack updates + appends a “Learning this week” footnote to the status page.

---

With the Academy live, you have delivery, safety, evidence, and knowledge in one place. Next up: consider a board-level governance brief (3-page deck) covering risk, uptime, velocity, and spend so executives see the same truth the operators do.
