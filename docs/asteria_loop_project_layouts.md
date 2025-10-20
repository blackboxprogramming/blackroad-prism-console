# Asteria Loop Project Layouts

This document outlines lightweight project management setups for the Asteria Loop effort. Both boards target the goal of enabling the first external creator to upload, publish, and receive a payout within 30 days.

> **Renaming reminder:** Asteria Loop replaces the former codename (now retired) to steer clear of trademark concerns raised during review.

## Asana Project: "Asteria Loop v0.1"

**Goal:** First external creator completes upload → publish → payout.

### Column 1: Backlog
- Write prompt for minimal upload–publish–payout app
- Decide stack (Node + Next + Stripe test mode)
- Design mock RoadCoin balance system
- Set up Asana + GitHub sync
- Create Slack channel `#asteria-loop`

### Column 2: In Progress
- Frontend upload form
- Gallery page
- Stripe integration
- Reward calculation logic
- First local test
  - Use sub-tasks for micro steps like “connect API key,” “handle errors,” and “style buttons.”

### Column 3: Review
- Security sweep (no exposed keys)
- UX test with 3 creators
- Verify payout manually ($5 Stripe test)
  - Assign reviewers (e.g., @Lucidia, @Copilot).

### Column 4: Done
- Loop runs end-to-end
- First payout confirmed
- Screenshots + short demo video uploaded
- 30-day report written

### Column 5: Next Sprint Ideas
- Add real RoadCoin backend
- Creator dashboard
- Marketplace prototype

**Automation Tip:**
- Connect GitHub → Asana integration so each PR auto-creates a task and moves cards when merged.
- Set a recurring “Friday Retro” task that asks: *What worked? What drained time? What should we cut?*

## Monday.com Board: "Asteria Loop v0.1"

**High-level Widget:** A dashboard view pinning goal metrics (time-to-first-payout, creator satisfaction), plus a workload chart.

### Board Structure
- **Groups:** Mirror Asana columns — *Backlog*, *In Progress*, *Review*, *Done*, *Next Sprint Ideas*.
- **Item Template Fields:**
  - **Owner (People column)** – assign delivery lead.
  - **Status** – default labels: Not started, In progress, Blocked, Ready for review, Done.
  - **Timeline** – start and target finish date to keep 30-day velocity visible.
  - **Dependencies** – connect tasks like “Stripe integration” → “Verify payout manually.”
  - **Numbers (Story Points)** – quick effort t-shirt sizing.
  - **Updates** – running thread for decisions, attach Loom demos or screenshots.

### Group Details
- **Backlog:** Seed items identical to Asana backlog. Add a *Priority* dropdown (High/Medium/Low) for quick triage. Use the *Ideas Form* to let collaborators submit additional backlog entries.
- **In Progress:** Mirror the development workstream. Create subitems for micro-steps (API keys, error handling, styling). Automation: when Status changes to “Ready for review,” move item to *Review* group.
- **Review:** Items require paired review. Custom automation: when all checklist subitems are complete, notify reviewers (@Lucidia, @Copilot) and set Status → “Reviewing.”
- **Done:** Add a mirrored RoadCoin balance column to reflect impact (e.g., +5 RC). Automation: when moved to Done, notify finance and append to "Loop Wins" update.
- **Next Sprint Ideas:** Keep stretch concepts visible. Set Status default to “Icebox” and include a *Value vs. Effort* column to prep for next planning cycle.

### Views & Automation
- **Kanban View:** Switch between Main Table and Kanban for at-a-glance flow.
- **Dashboard View:** Widgets for cycle time, completed payouts, and retro notes.
- **Automations:**
  - When a GitHub PR is merged, mark the linked item as Done and move to the *Done* group.
  - Every Friday at 4pm, create a new item “Friday Retro” with checklist: *What worked?*, *What drained time?*, *What to cut?*
  - If a task stays in Review > 2 days, ping owner and reviewers via Slack integration.

### Integrations & Best Practices
- Connect GitHub integration (item created per PR, auto-link branch).
- Link Stripe test dashboard for payout verification.
- Use Workdocs page "Asteria Loop Playbook" to store SOPs and attach demo videos.
- Pin a whiteboard for mapping the creator experience flow.

This paired layout lets the team pilot the loop in Asana while keeping a migration-ready structure in Monday.com if deeper reporting or automation is needed.
