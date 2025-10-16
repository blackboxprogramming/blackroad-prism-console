# Git Automation Help Center (#help)

Welcome to the shared landing zone for humans, agents, and bots collaborating on BlackRoad's Git automation initiative. This hub orients you to the `#help` channel, the emoji-driven template system, and the learning paths that make it easy to contribute.

---

## Quick start for new contributors
1. Skim [`README_PR_AUTOMATION.md`](../README_PR_AUTOMATION.md) for the design tenets that govern automation pull requests.
2. Explore the emoji template library (overview below) to find a workflow that matches your task.
3. Join the `#help` channel and introduce yourself. Include:
   - Your focus area (e.g., CI pipelines, release automation, onboarding playbooks).
   - Current blockers or questions.
   - Templates you intend to author or improve.
4. Search GitHub Issues labeled `automation-template` for open work, or propose a new template idea.
5. Share progress in `#help` so maintainers can offer reviews, pairing, or escalations.

---

## Emoji-driven project & personal productivity template system

> A library of 200+ modular, emoji-labeled checklists that anyone can mix-and-match to run projects, ship features, and protect well-being without skipping critical steps.

### Why emoji templates?
- **Memorable:** Each template is anchored by a unique emoji (🛠, 🧪, 🧭, …) so you can spot it instantly in chat, issues, or dashboards.
- **Modular:** Combine 3–6 step checklists into larger playbooks to guide complex missions while keeping individual steps lightweight.
- **Inclusive:** Designed for humans, AI agents, and bots—status emojis (⚪️/🟡/🟢) enable automation and shared visibility across tools.
- **Automation-ready:** The consistent structure is simple for scripts to parse, auto-post, and enforce inside GitHub, Notion, Salesforce, Slack, and beyond.

### Template anatomy
- **Emoji header & title:** e.g., `🛠 Build Setup` or `🧭 Feature Kickoff`.
- **Purpose line:** A crisp statement describing when to deploy the checklist.
- **3–6 actionable items:** High-impact actions phrased as verbs.
- **🟡 Uncertainty/Delegation prompt:** Encourages people (and agents) to seek help when needed.
- **Status emojis:** Use ⚪️ (not started), 🟡 (in progress/needs attention), and 🟢 (done) to track flow.

### Status lifecycle & logging
| Emoji | Meaning | Usage tips |
|-------|---------|------------|
| ⚪️ | To do | Default state when a template or step is spawned. |
| 🟡 | In progress / needs support | Flip to 🟡 when you start work or encounter a blocker; trigger escalations if an item stays 🟡 too long. |
| 🟢 | Complete | Mark when validated; automation can require 🟢 before merge or launch. |

Every status change can be logged (via bots or manual notes) to create an audit trail for retrospectives, compliance, or future training.

---

## Template categories & example checklists

Each template is presented with an emoji, a purpose statement, and a short checklist you can copy into issues, docs, or bots. Feel free to mix sections together for larger playbooks.

### 1. Software Engineering

#### 🛠 Build Setup — *Prepare and run a fresh build for your project.*
- [ ] Pull the latest code and install/update dependencies.
- [ ] Run the build script or compiler (e.g., `npm run build`, `make`).
- [ ] Confirm the build finishes cleanly and produces artifacts.
- [ ] Archive or upload build outputs if required.
- [ ] 🟡 Build failing or unclear? Loop in a senior engineer or inspect CI logs.

#### 🧪 Test Suite Run — *Execute automated tests to validate new changes.*
- [ ] Run unit/integration suites locally or via CI.
- [ ] Ensure all tests pass; investigate and fix any failures.
- [ ] Check coverage or quality gates (linting, static analysis).
- [ ] Confirm new features ship with matching tests.
- [ ] 🟡 Unsure about a failure? Ask QA or a mentor to help debug.

#### 🔄 CI/CD Deployment — *Promote code safely through the pipeline.*
- [ ] Verify the latest commit is green in CI.
- [ ] Update the version/tag per release standards.
- [ ] Deploy to staging and smoke-test key paths.
- [ ] Secure sign-off before promoting to production.
- [ ] Monitor production health dashboards post-deploy.
- [ ] 🟡 Encounter issues? Page DevOps/on-call and consider rollback.

#### 🔒 Security Audit — *Run a lightweight security sweep.*
- [ ] Update dependencies and scan for vulnerabilities.
- [ ] Confirm secrets are managed securely (no creds in code).
- [ ] Review access controls for least-privilege alignment.
- [ ] Execute static analysis or OWASP-aligned checks.
- [ ] 🟡 Unsure about a finding? Consult a security engineer or handbook.

#### 🧹 Clean Up PR — *Polish a pull request before merge.*
- [ ] Rebase/merge latest `main` and resolve conflicts.
- [ ] Re-run tests or confirm CI stays green.
- [ ] Self-review for style, comments, and stray debug logs.
- [ ] Update docs or comments that changed.
- [ ] ✅ Ready? Mark the PR for review/merge.
- [ ] 🟡 Need another set of eyes? Request an extra reviewer in `#help`.

### 2. Product & Design

#### 🧭 Feature Kickoff — *Align the team at project start.*
- [ ] Define goals and success metrics.
- [ ] Identify stakeholders and contributors.
- [ ] Schedule the kickoff meeting and share context.
- [ ] Draft initial user stories or requirements.
- [ ] 🟡 Scope fuzzy? Sync with product leadership or users first.

#### 🎨 Design Review — *Evaluate UI/UX quality and consistency.*
- [ ] Compare against the style guide (colors, spacing, accessibility).
- [ ] Walk the user flow to ensure it feels intuitive.
- [ ] Gather at least one peer review or quick usability test.
- [ ] Document changes and update design files.
- [ ] 🟡 Stuck on a UX decision? Loop in a researcher or senior designer.

#### 📜 Requirements Handoff — *Transfer product specs to design/engineering.*
- [ ] Finalize clear, scoped requirements or user stories.
- [ ] Review with engineering/design leads to resolve questions.
- [ ] Attach assets (wireframes, diagrams) to the doc/ticket.
- [ ] Define acceptance criteria for each requirement.
- [ ] 🟡 Stakeholder hesitant? Schedule a follow-up alignment session.

#### 🔍 Usability Test — *Validate a feature with real users.*
- [ ] Recruit 3–5 representative testers.
- [ ] Prepare key tasks or scenarios.
- [ ] Observe, record friction points, and capture quotes.
- [ ] Summarize findings and propose improvements.
- [ ] 🟡 Feedback ambiguous? Debrief with the product trio for insight.

#### 🤝 Stakeholder Handoff — *Close the loop with clients or sponsors.*
- [ ] Assemble demo materials highlighting outcomes.
- [ ] Prepare training or documentation for end users/support.
- [ ] Host the handoff session and gather feedback.
- [ ] Log any follow-up tasks or tracking needs.
- [ ] 🟡 Concerns raised? Loop in project sponsors for next steps.

### 3. Learning & Mentorship

#### 🌱 Learning Plan — *Design a focused skill growth roadmap.*
- [ ] Define your learning goal.
- [ ] Select 2–3 high-quality resources.
- [ ] Schedule study or practice blocks.
- [ ] Track milestones and adjust pace as needed.
- [ ] 🟡 Need ideas? Ask mentors or peers for recommended materials.

#### 🔄 Feedback Loop — *Collect actionable feedback.*
- [ ] Choose who to ask and clarify the review scope.
- [ ] Share context and materials in advance.
- [ ] Capture feedback during the session.
- [ ] Translate feedback into concrete next steps.
- [ ] 🟡 Feedback unclear? Follow up or involve a neutral third party.

#### 📝 Learning Log — *Reflect on weekly growth.*
- [ ] List 1–3 new learnings or practices.
- [ ] Note how you applied (or will apply) them.
- [ ] Capture blockers or new questions.
- [ ] Share highlights with a peer or mentor.
- [ ] 🟡 Light week? Seek a new challenge or ask for a micro-lesson.

#### 🙋 Ask for Help — *Frame assistance requests clearly.*
- [ ] Write down the problem and context.
- [ ] Document attempts you already made.
- [ ] Draft a concise explanation of where you’re stuck.
- [ ] Choose the right channel/person to ping.
- [ ] Provide reproducible details when asking.
- [ ] 🟡 No response? Politely follow up or escalate to another expert.

#### 🤝 Mentor Check-In — *Maximize mentor/mentee sessions.*
- [ ] Review previous notes and progress.
- [ ] Prepare 1–2 topics or questions.
- [ ] Share wins and challenges candidly.
- [ ] Align on new goals or experiments.
- [ ] 🟡 Need more support? Discuss additional resources or contacts.

### 4. Team Operations

#### 🔄 Daily Stand-up — *Keep daily syncs crisp.*
- [ ] Share yesterday’s accomplishments.
- [ ] State today’s focus.
- [ ] Surface blockers and assign helpers.
- [ ] Update the task board accordingly.
- [ ] 🟡 Conversation drifting? Re-center on the three questions.

#### 📅 Sprint Retro — *Retrospect and improve.*
- [ ] Gather input on what went well, didn’t, and ideas to try.
- [ ] Discuss and prioritize key themes.
- [ ] Commit to 1–3 improvement actions with owners.
- [ ] Document the retro outcomes for reference.
- [ ] 🟡 Engagement low? Experiment with a new retro format.

#### 🧑‍💼 Hiring Loop — *Run a structured interview cycle.*
- [ ] Define stages, interviewers, and scorecards.
- [ ] Brief the panel with candidate context.
- [ ] Conduct interviews and log feedback promptly.
- [ ] Hold a debrief to reach a decision.
- [ ] Communicate outcomes and update the ATS.
- [ ] 🟡 Uncertain verdict? Arrange a follow-up or consult the hiring manager.

#### 🎉 Onboarding New Hire — *Ramp teammates smoothly.*
- [ ] Provision accounts and equipment before day one.
- [ ] Share a week-one onboarding plan.
- [ ] Assign a buddy/mentor and schedule intros.
- [ ] Check in at the end of weeks one and two.
- [ ] 🟡 New hire overwhelmed? Adjust pace and offer extra support.

#### 📈 OKR Planning — *Set measurable team goals.*
- [ ] Review last period’s OKRs and outcomes.
- [ ] Brainstorm aligned objectives for the next cycle.
- [ ] Draft measurable key results (2–5 per objective).
- [ ] Refine with the team and secure buy-in.
- [ ] Document OKRs and assign owners.
- [ ] 🟡 Alignment shaky? Loop in leadership for priority guidance.

### 5. Emotional & Interpersonal

#### 😊 Team Check-In — *Gauge mood before diving into work.*
- [ ] Invite each person to share a one-word/emoji feeling.
- [ ] Ask for any blockers or wins.
- [ ] Acknowledge each share without judgment.
- [ ] Adjust agenda if energy is low or stress is high.
- [ ] 🟡 Group quiet? Lead by example or use an anonymous poll.

#### ⚡ Energy Scan — *Pulse the team’s energy level.*
- [ ] Have teammates rate energy (1–5 or 🔋 icons).
- [ ] Follow up with outliers privately.
- [ ] Break or change pace if energy dips.
- [ ] Capitalize on high energy for tough work.
- [ ] 🟡 Unsure of the vibe? Take a short break and reassess.

#### 🛑 Boundary Setting — *Protect sustainable work habits.*
- [ ] Communicate working hours and response expectations.
- [ ] Block focus time and respect others’ blocks.
- [ ] Say “no” or “later” when at capacity.
- [ ] Encourage time off and healthy pacing.
- [ ] 🟡 Feeling burned out? Talk with a manager or HR.

#### 🤗 Appreciation Ritual — *Celebrate contributions regularly.*
- [ ] Start/end the week with gratitude or shout-outs.
- [ ] Maintain a kudos channel or board.
- [ ] Highlight at least one win in team meetings.
- [ ] Promote peer recognition programs.
- [ ] 🟡 Someone overlooked? Appreciate them privately and publicly.

#### 💬 Conflict Check — *Address tensions constructively.*
- [ ] Spot early signs and schedule a private chat.
- [ ] Use “I” statements and active listening.
- [ ] Invite a neutral mediator if needed.
- [ ] Agree on actionable next steps.
- [ ] Follow up after a few days.
- [ ] 🟡 Still sensitive? Escalate to a manager or HR partner.

### 6. Domestic & Self-Care

#### 🌅 Morning Reset — *Start the day centered.*
- [ ] Make your bed and tidy your space.
- [ ] Spend 5–10 minutes on mindfulness.
- [ ] Review top priorities for the day.
- [ ] Fuel up with water and a healthy breakfast.
- [ ] 🟡 Off routine? Focus on one essential action and ease in.

#### 🧘 Focus Prep — *Prime for deep work.*
- [ ] Choose a single task and set a clear goal.
- [ ] Remove distractions (silence devices, close tabs).
- [ ] Set a timer (e.g., 25-minute pomodoro).
- [ ] Take a mindful breath before starting.
- [ ] 🟡 Can’t focus? Try a shorter interval or brain dump distractions.

#### 🏠 Daily Shutdown — *End the day with intention.*
- [ ] Check off completed tasks; note carry-overs.
- [ ] Tidy workspace and power down devices.
- [ ] Reflect on wins and lessons in a journal.
- [ ] List top priorities for tomorrow.
- [ ] 🟡 Work lingering? Capture stray thoughts then transition to rest.

#### 🍽️ Meal Prep — *Plan healthy meals in advance.*
- [ ] Choose recipes for upcoming days.
- [ ] Audit pantry/fridge and create a grocery list.
- [ ] Shop or order needed ingredients.
- [ ] Batch-cook base dishes.
- [ ] Portion meals into grab-and-go containers.
- [ ] 🟡 No time to cook? Consider a meal service or prep with a friend.

#### 🎉 Social Recovery — *Recharge after intense events.*
- [ ] Block quiet time post-event.
- [ ] Do a calming activity you enjoy.
- [ ] Note highlights and follow-up actions.
- [ ] Say no to extra plans until recharged.
- [ ] 🟡 Still drained? Communicate needs and prioritize restorative care.

---

## Composite “Big Kahuna” launch protocol
- **Purpose:** Coordinate multi-team product launches end-to-end.
- **Flow:** Chain the relevant emoji templates together (🧭 Kickoff → 📜 Requirements → 🎨 Design → 🛠 Build → 🧪 Test → 🔒 Security → 📢 Marketing → 🚀 Launch → ✅ Post-launch retro).
- **Status:** Track each stage with ⚪️/🟡/🟢 and log ownership in shared dashboards.
- **Outcome:** Everyone shares one authoritative view of readiness and post-launch health.

---

## Integration & automation ideas
- **GitHub Actions & bots:** Auto-comment checklists on PRs, enforce 🟢 before merge, and listen for slash commands (e.g., `/done 3`).
- **Salesforce Flows:** Trigger handoff templates when opportunities change stages; alert managers if steps stay 🟡.
- **Notion & docs:** Store templates as database entries or buttons that spawn ready-to-use pages with checkbox blocks.
- **Chat assistants:** Allow `/template onboarding` in Slack/Teams to post the 🎉 Onboarding checklist; react with ✅ to flip steps to 🟢.
- **Unified dashboards:** Aggregate template status to monitor engineering readiness, team health, and personal rituals in one view.

---

## Contribution workflow recap
1. Fork or branch from `main`.
2. Add or update templates in `templates/` (or relevant directory) using the emoji structure.
3. Document automation hooks and testing notes alongside each template.
4. Run relevant linters/tests before submitting.
5. Open a PR, share it in `#help`, and request reviews from listed maintainers.

---

## Escalation pathways
- **Urgent automation blockers:** Tag maintainers in `#help` and open an issue labeled `priority:high`.
- **Secrets/compliance:** Avoid sharing sensitive data in chat. Email [`security@blackroad.dev`](mailto:security@blackroad.dev) with context.
- **Infrastructure questions:** Consult `infra/README.md` or ask in `#infra`.

---

## Learning resources
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [BlackRoad PR Automation Runbook](../RUNBOOK.md)
- [Automation Evidence Bundle Guide](docs/WRAPPER_ALIAS_CONFIG.md)
- Maintainer office hour recordings (see pinned messages in `#help`).

---

Need updates or spot gaps? Submit a PR touching `resources/git-automation-help.md` and notify the `#help` channel so the team (humans and agents alike) can validate and ship improvements.
