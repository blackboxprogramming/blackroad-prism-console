# Cadillac Loop Sprint Plan in Asana

This guide maps the Cadillac Loop workflow into a single Asana project so a small team can execute the four-week prototype push without tool sprawl.

## Project Overview
- **Project name:** `Cadillac Loop – Build 0.1`
- **View:** Board (columns reflect the weekly cadence plus an icebox for future ideas).
- **Sections / Columns:**
  1. **Week 0 – Backlog Intake**
  2. **Week 1 – Setup & Grounding**
  3. **Week 2 – Build & Test**
  4. **Week 3 – Invite & Reward**
  5. **Week 4 – Debrief & Publish**
  6. **Done / Archive**

> Keep the project lightweight: no custom fields beyond assignee, due date, and status. Use Slack for quick questions and GitHub Issues for engineering subtasks when needed.

## Column Details & Tasks

### Week 0 – Backlog Intake
Use this column to capture ideas that are out-of-scope for the initial loop. If a request comes up mid-sprint (e.g., “add RoadCoin referral bonuses”), drop it here and revisit after Build 0.1.

**Default tasks:**
- "Future Feature Requests" (multi-homed to a longer-term roadmap if you have one).
- "Risks / Blockers" (log anything that could delay the loop; review briefly each stand-up).

### Week 1 – Setup & Grounding
Create the Week 1 column with tasks that orient the team and lock in tooling.

| Task | Assignee | Due | Notes |
| --- | --- | --- | --- |
| "Choose Planning Stack" | Product lead | Day 1 | Confirm Asana board and archive any Jira/Trello artifacts. |
| "Create Cadillac Loop Board" | Ops | Day 1 | Set up project, invite collaborators, configure columns. |
| "Tooling Checklist" | Ops | Day 2 | Ensure Slack channel, GitHub repo, and Stripe test accounts ready. |
| "Codex Prompt Draft" | Tech lead | Day 3 | Write and pin the Codex prompt in the Slack channel. |
| "Kickoff Sync" | Everyone | Day 3 | Review scope, assign Week 2 tickets, set expectations for testing cadence. |

### Week 2 – Build & Test
Move Week 2 tickets here once they’re ready to start. Each ticket should have:
- A one-line goal (e.g., “Allow creators to upload a file and metadata”).
- Acceptance criteria (bulleted in the task description).
- Links to related GitHub Issues or branches.

| Task | Assignee | Due | Notes |
| --- | --- | --- | --- |
| "Upload Form" | Copilot or engineer | Mid-week | Includes validation and storage wiring. |
| "Gallery Page" | Engineer | Mid-week | Displays uploaded items with mock balances. |
| "Mock Reward Logic" | AI agent | Mid-week | Use Stripe test mode + RoadCoin balance simulation. |
| "Stripe Webhook" | Engineer | End of week | Handles payment events in test mode. |
| "Manual Payout Trigger" | Product/engineer | End of week | Simple admin action; can be CLI if faster. |
| "Run E2E Smoke Test" | Tech lead | End of week | Checklist: upload -> publish -> trigger payout. |

Use subtasks for implementation notes (e.g., “Generate upload component”, “Write integration test”), and link back to the GitHub Issue ID for traceability.

### Week 3 – Invite & Reward
Focus on external feedback and UX refinement.

| Task | Assignee | Due | Notes |
| --- | --- | --- | --- |
| "Recruit Testers" | Ops | Day 1 | Identify three testers; confirm compensation (gift cards, cash app, etc.). |
| "Tester Onboarding Pack" | Ops/Product | Day 2 | Provide instructions, Stripe test card numbers, and feedback form link. |
| "Run Live Test Sessions" | Product lead | Day 3 | Schedule 30-minute walkthroughs; record notes. |
| "Collect Feedback" | Ops | Day 4 | Centralize raw quotes, confusion points, delights. |
| "UX Tweaks" | Engineer | Day 5 | Only address clarity issues surfaced by testers. |
| "Capture Loop Evidence" | Ops | Day 5 | Screenshots, screen recordings, payout confirmation snippets. |

### Week 4 – Debrief & Publish
Close the loop with reflection and storytelling.

| Task | Assignee | Due | Notes |
| --- | --- | --- | --- |
| "Schedule Retro" | Ops | Day 1 | 45-minute call; include testers if possible. |
| "Retro Facilitation" | Product lead | Day 2 | Questions: what worked, what drained time, what emotions when paid. |
| "Summarize Findings" | Product lead | Day 3 | Draft Build 0.1 Report (one page). |
| "Publish Build 0.1 Report" | Ops/Product | Day 4 | Share in Slack, email investors/partners. |
| "Archive Completed Tasks" | Ops | Day 4 | Move done items to Done/Archive, tag learnings. |

### Done / Archive
When a task is complete, move it here. Use Asana’s custom field or tags to capture learnings (e.g., `#insight`, `#followup`). Once the loop ends, export completed tasks for historical reference.

## Cadence Tips
- **Daily check-in:** 10-minute async update in Slack (`Yesterday / Today / Blockers`).
- **Weekly recap:** End of each week, link Asana tasks to proof-of-work (GitHub PRs, Stripe test receipts).
- **Integration with GitHub:** If engineering-heavy, keep detailed implementation notes in GitHub Issues; use Asana tasks as the high-level work units.
- **Maintain focus:** Limit the board to active weeks only; defer any “nice to have” features to Week 0 backlog.

## Acceptance Criteria for Success
- All Week 2 tasks include acceptance criteria and links to code references.
- Three external testers complete the loop and receive payouts by the end of Week 3.
- Build 0.1 Report summarizes outcomes, tester sentiment, and next steps by end of Week 4.

Following this structure keeps the Cadillac Loop manageable while providing visibility to stakeholders and a ready-made narrative for future fundraising or partnership conversations.
