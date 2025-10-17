# Notion & Slack Kickoff Pack

This pack provides copy-paste ready content to launch the initial BlackRoad operational workspace in Notion and the first round of Slack announcements aligned with the operating model described in the rollout plan.

---

## Notion structure

Create the following page hierarchy in the BlackRoad HQ workspace. Indentations indicate sub-pages or linked databases.

- **BlackRoad HQ (Home)** – landing page with quick links, SoR legend, and current priorities.
  - **Company Cadence** – overview of ceremonies and schedule.
    - Daily Stand-up (Recurring Task Reference)
    - Weekly Planning (Agenda)
    - Friday Demo & Review (Agenda)
    - Biweekly Retro (Agenda)
  - **Decision Log** – linked database to track major calls (Context, Options, Decision, Owner, Date, Impact, Link).
  - **Risk Register** – linked database for project risks (Risk, Level, Impact, Probability, Owner, Mitigation, Status).
  - **Ops Hub (blackroadinc.us)** – operations center.
    - People Ops
    - Finance & Legal
    - Marketing & Social
    - Helpdesk & Support
  - **Product Hub (blackroad.io)** – product delivery center.
    - PRISM Console
    - Roadio
    - Product Templates & Backlogs (links to Jira/Asana views)
  - **Resources & SOPs** – shared knowledge base.
    - Systems of Record
    - SOP Library
    - Templates & Checklists

For each highlighted page, seed the content below.

### BlackRoad HQ (Home)
- Mission statement and current focus.
- Quick links: Slack (#announcements), Asana portfolio (BlackRoad Ops), Jira projects (PRISM, ROD), Airtable Growth Calendar, Google Calendar.
- Status blocks: "This Week's Priorities", "Key Risks", "Upcoming Reviews" pulling from linked databases.

### Company Cadence page content
```
# Company Cadence

**Operating Rhythm**
- Daily Stand-up (async, Slack #announcements thread, 10:00 AM deadline)
- Weekly Planning (Mondays, 30 minutes, review Asana & Jira)
- Weekly Demo & Review (Fridays, 15 minutes per product, shared notes here)
- Biweekly Retro (alternate Fridays, 30 minutes, capture actions in Asana)

**Templates**
- Stand-up: Yesterday / Today / Blocked + emoji reactions ✅⚠️🚫
- Planning: Goals, Capacity check, Sprint/Week commitments, Risks
- Demo: What changed, What we learned, What's next
- Retro: Start / Stop / Continue, Action owners, Due dates

Link: [Asana Project – Company Cadence](https://app.asana.com/0/) (update with live URL once created).
```

### Decision Log database template
Use database properties {Context, Options, Decision, Owner, Date, Impact, Link}. Seed entries:
1. **Asana vs Jira split** – Owner: Alexa – Decision: Ops in Asana, Eng in Jira – Impact: Align work to SoR – Date: <today> – Link: Slack #announcements.
2. **Public channels default** – Owner: Leadership – Decision: Public by default, private by exception – Impact: Transparency – Date: <today> – Link: Slack #announcements.
3. **Branch strategy** – Owner: Engineering – Decision: feat/PRISM-###-slug naming, PR review required – Impact: Consistent flow – Date: <today> – Link: GitHub handbook.

### Risk Register database template
Seed risks:
1. Security hardening for PRISM – Level 2 – Mitigation: OWASP checklist, security reviews.
2. Data source volatility – Level 2 – Mitigation: contract monitoring, backup connectors.
3. CI flakiness – Level 1 – Mitigation: 10-minute pipeline target, alerting.
4. Hiring bandwidth – Level 2 – Mitigation: prioritize recruiter sourcing.
5. Scope creep on v0.1 – Level 1 – Mitigation: strict backlog grooming & DoD enforcement.

### Ops Hub (blackroadinc.us)
- Section headers for People Ops, Finance & Legal, Marketing & Social, Helpdesk & Support.
- Each section links to corresponding Asana projects or Airtable bases.
- Include intake instructions: "Post in Slack → convert to Asana task via integration".

### Product Hub (blackroad.io)
- Subpages for PRISM and Roadio.
- Each subpage includes: Product vision blurb, Jira board link, latest release plan, key metrics, next demo date.

### Resources & SOPs
- Systems of Record index referencing Slack, Asana, Jira, Notion, Airtable.
- Template gallery referencing onboarding checklist, incident response, backlog hygiene.

---

## Slack announcement copy

Use the following posts in `#announcements`. Post them sequentially so the team can follow along and react with the ✅ emoji once done.

### Post 1 – Welcome & SoR map
```
:wave: Welcome to BlackRoad HQ!

We now have our core systems of record wired up:
- Slack = company comms (public by default)
- Asana = operations + growth work (blackroadinc.us)
- Jira = product & engineering issues (blackroad.io)
- GitHub = code, protected main branches, PR reviews required
- Notion = docs, SOPs, and decisions (BlackRoad HQ workspace)
- Airtable = growth calendar + partner tracking

Keep work inside its home, link across tools, and default to public channels. More setup details follow. :rocket:
```

### Post 2 – Daily async stand-up
```
:alarm_clock: **Daily Stand-up starts tomorrow**
- Post in this channel by 10:00 AM PT using a thread on this message.
- Format: ✅ Yesterday / 🎯 Today / ⚠️ Blocked.
- Short and sweet (2–3 bullets). Tag teammates if you need help.

Missed the deadline? The stand-up bot will nudge you in Asana. :robot_face:
```

### Post 3 – Weekly cadence
```
:spiral_calendar_pad: **Weekly cadence**
- Monday 10:30 AM PT – Planning (Asana + Jira review)
- Friday 11:00 AM PT – Product demo & review (15 min/product)
- Retro every other Friday at 3:00 PM PT

Agendas & notes live in Notion › Company Cadence. Please review ahead of time and drop pre-reads in the meeting comments.
```

### Post 4 – Definition of Done Done
```
:white_check_mark: **Done Done = deployable, documented, tested, observed, demoed.**

Before you call anything complete:
1. Code merged via PR with passing CI
2. Tests updated or added
3. Docs / runbooks refreshed in Notion
4. Monitoring or logging in place
5. Ready to demo at Friday review

Hold the line—small batches, fast feedback, zero bug carry-over.
```

### Post 5 – Channel & owner mentions
```
:hash: Channels & groups live!
- #ops (Ops workstreams) – @ops
- #eng (Engineering + Jira flow) – @eng
- #products-prism (PRISM delivery) – @eng @leadership
- #products-roadio (Roadio incubator) – @eng @growth
- #growth (Marketing + GTM) – @growth
- #helpdesk (Internal support triage)
- #random (watercooler)

Set channel topics today so newcomers know where to go. Ping @leadership if you need a private space.
```

Use these posts as-is or tailor dates/times before publishing. Once live, link each announcement back into the relevant Notion pages for traceability.
