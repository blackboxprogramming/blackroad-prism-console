# GitHub Comment Template

Here’s a single, reusable GitHub comment template you can drop on any issue or pull request to: acknowledge, scope, assign, run checks, set up tests, configure agents, and propose next steps—fast.

⸻

✅ Summary / Intent

Request: 
Outcome target: 

📦 Scope & Acceptance
• Clear user story: As a ___, I want ___ so that ___
• Acceptance criteria:
• AC1: …
• AC2: …
• AC3: …
• Non‑goals / out of scope: …

🔗 Links & Context
• Spec/Design: …
• Related Issues/PRs: …
• Logs/Screens: …

🧪 Tests (add before/with PR)
• Unit: files touched have ≥1 new test
• Integration: scenario X covered
• e2e (if applicable): case Y covered
• CI: green on main & branch

🛠️ Steps I’ll Take (owner: @assignee)
1. Draft change (small, reviewable commits)
2. Add/adjust tests
3. Run CI locally and in Actions
4. Update docs/CHANGELOG
5. Request review
6. Merge with squash + conventional commit

⚙️ Commands (paste as needed)

# Local quick checks
npm test
npm run lint
npm run build

# Python example
pytest -q
ruff check .

🤖 CI / Agents
• Trigger CI now: /ci run
• Re-run failed jobs: /ci retry
• Spin up preview: /deploy preview
• Configure agents:
    • Roadie: /agent roadie configure --plan=default
    • Guardian: /agent guardian audit
    • Codex: /agent codex suggest --tests --docs
    • Cadillac: /agent cadillac review --style --risk

(Wire these to your bot/GitHub Actions if you use them.)

🔍 Code Review Checklist (for PRs)
• Small diffs; clear commit messages
• Types & null paths handled
• Errors logged w/ context
• Secrets & keys not in code
• Performance & memory sane
• Security notes (input, auth, perms)
• Docs updated

🧭 Next Steps / Decision
• Proceed with implementation
• Needs clarifications (list)
• Propose alternative (brief)

⸻

One‑liner you can post immediately

Thanks for the request! I’ve captured scope, tests, CI, agent setup, and a step‑by‑step plan above. If you’re good with the acceptance criteria, I’ll proceed and open a PR with tests and docs. ✅

If you want, I can also generate a matching GitHub Actions workflow that responds to /ci run, /deploy preview, and the agent slash‑commands.
