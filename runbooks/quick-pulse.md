# Quick Pulse Review & Rollback Guide

The Quick Pulse workflow keeps merges predictable and auditable. Use this runbook to review a change set and execute a rollback if something goes sideways.

## How to Review a Quick Pulse PR

1. **Open the PR and confirm the HASH ID** is present in the title, body, and commit history. The same ID should appear in ClickUp/Jira/monday labels and any status bots.
2. **Check the Quick Pulse checklist** in the PR body. Every required box must be checked and linked. Use the comment template from `/docs/pulse/README.md` to capture context and outstanding work.
3. **Run targeted automation when needed.**
   - Comment `@Codex run security-sanity` to trigger secret scans and policy checks on the latest commit.
   - Comment `@Codex run tests` to re-run the project test suite on the PR head.
   - Comment `@Codex ship when green` once all checks pass to queue auto-merge.
4. **Review code and approvals.** Ensure the right reviewers are tagged (CODEOWNERS will auto-request for `.github`, `docs`, and other directories).
5. **Validate the merge plan**: migrations/flags ordered correctly, blast radius acknowledged, rollback path explained in plain language.
6. **Update PM tooling** with the shared HASH ID once the PR is ready for merge.

## Rollback Playbook

1. **Identify the HASH ID** from the PR body or commit. Include it in any incident or change ticket updates.
2. **Execute the documented rollback path.** This may be:
   - `git revert <commit>` for code changes.
   - Flipping a feature flag or redeploying the previous container image tag.
   - Restoring an infrastructure snapshot (note the snapshot ID in the PR).
3. **Validate reversal** using the same telemetry watch defined in the PR template. Confirm dashboards and alerts return to expected ranges.
4. **Log the rollback** in the original Quick Pulse comment thread and any external task board, referencing the HASH ID.
5. **Follow up** with a fresh Quick Pulse entry if a hotfix or rework PR is required.

If you’re unsure at any step, write “I don’t know yet — need a hand with <X>” and tag the teammate who can guide you.
