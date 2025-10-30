# GitHub Comment Template

Use the snippet below to standardize responses on issues and pull requests. It reflects the tooling and workflows that ship with this repository (Node 20 + npm scripts, Jest, ESLint, Next.js build, etc.).

```markdown
### ✅ Summary
- **Request:** <one-liner of what’s needed>
- **Owner:** @assignee
- **ETA:** <date or "TBD">
- **Scope:** <files/areas touched>
- **Risk:** low / med / high

---

### 📌 Decisions / Context
- Why: <brief reason / link to prior discussion or doc>
- Done when:
  - <clear acceptance criteria bullets>

---

### 🔧 Actions (check off as you go)
- [ ] Link related issue(s): #<id>
- [ ] Add/confirm labels: `type:feature` `area:backend` `priority:P1`
- [ ] Create/confirm tests (unit/integration/e2e)
- [ ] Update docs / changelog
- [ ] Security & perf review (if needed)
- [ ] Approvals: @reviewer1 @reviewer2

---

### 🧪 Tests & Commands
```bash
# setup
npm install

# lint & typecheck
npm run lint
npm run typecheck

# unit tests (watch + coverage)
npm test -- --watch=false --coverage

# integration/e2e (headless)
# (add npm scripts when available, e.g., npm run e2e -- --ci)

# build
npm run build

# health checks
npm run health
```

- Expected key tests to exist:
  - [ ] `tests/` API + integration specs
  - [ ] `sites/blackroad/` E2E coverage (if applicable)

⸻

🚦 CI / Automation
  • Ensure GitHub Actions run on push + PR (lint, test, build)
  • Required checks: ✅ Lint ✅ Unit ✅ Build ✅ Health
  • Add preview deployment comment (if available)

Slash commands (if your bots support them):
  • /retest — rerun CI
  • /assign @name
  • /cherry-pick release/x.y
  • /size-limit
  • /label type:bug priority:P1

⸻

🤖 Agents (Cadillac · Lucidia · Codex)
  • Generate test scaffold: `/agent tests --paths srv/,sites/`
  • Generate docs diff: `/agent docs --from main`
  • Risk matrix: `/agent risk --files changed`
  • Next steps plan: `/agent plan --acceptance`

⸻

🔍 Review Checklist (for approvers)
  • Small, focused diffs (≤ ~300 LOC)
  • Clear naming, no dead code
  • Errors handled, logs sane
  • Inputs validated, secrets not in code
  • Perf & security notes addressed
  • Rollback plan or feature flag noted

⸻

🚢 Merge Strategy
  • Type: squash / rebase / merge
  • Post-merge:
  • Tag release: vX.Y.Z
  • Deploy to: dev → staging → prod
  • Smoke checks complete
  • Announce in #eng-updates with changelog link

⸻

▶️ Next Steps (auto-fill after review)
 1. — @owner — due
 2. <follow-up ticket> — create #
 3. <docs/tutorial update> — link PR
```
