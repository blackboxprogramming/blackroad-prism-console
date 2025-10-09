# Blanket Comment Response Guide

Use this guide whenever someone tags the broader team (for example: `@Copilot @BlackRoadTeam @Codex @Cadillac @Lucidia @Cecilia @blackboxprogramming`) and drops the "Quick pulse before we move" checklist. The goal is to help every contributor—seasoned or brand-new—reply with a clear, actionable status update.

## 1. Gather the essentials first

Before responding, collect the following inputs so your reply is accurate:

1. **Identify the work item.** Skim the PR title, description, linked issues, or deployment request to restate the scope in a single sentence.
2. **Review recent changes.** Note any migrations, credential updates, or config changes that could affect security posture or runtime behavior.
3. **Check existing signals.** Look at CI runs, automated security scans, dependency bots, and staging deploy logs to confirm what already passed or failed.
4. **Confirm pending actions.** Ask owners of open threads/tests whether anything is blocking, and include that status in your reply.

## 2. Fill in the quick-pulse block

Mirror the structure of the blanket comment so reviewers can scan it quickly:

- **Context:** Provide a concise summary (≤1 sentence) of what the PR or request covers. Mention affected services or user impact if relevant.
- **Security sanity:** Call out any secret/credential handling steps you audited (e.g., checked `.env`, verified masked logs, rotated tokens). If no sensitive changes exist, explicitly state "No secrets touched in this change."
- **Tests:** List the automated suites or manual checks you ran and their status. Include command names (`npm test`, `pytest`, `terraform plan`, etc.) so others can reproduce.
- **Merge plan:** Explain the next gating step—e.g., "awaiting QA sign-off," "merge after approvals," or "holding for Tuesday deploy window." Include rollback or feature-flag notes when applicable.

> **Tip for newcomers:** If you are unsure about a section, state what you attempted and flag who you need help from. Transparency beats silence.

## 3. (Optional) add the Ops/Infra block

Use the Ops/Infra add-on when the work touches deployment, infrastructure, or security hardening.

- **Security sweep:** Confirm config files, IaC manifests, or secrets managers remain clean. Mention tooling used (e.g., `trufflehog`, `checkov`).
- **Dependency freeze:** Note whether dependency locks changed. If they did, state who reviewed or how you validated compatibility.
- **CI/CD check:** Verify pipelines, runners, or environment variables line up across dev/stage/prod. Call out any drift.
- **Telemetry watch:** Outline what dashboards or alerts you will monitor post-merge and for how long.

Skip this block if nothing infrastructure-related changed—no need to add noise.

## 4. Close with next steps & checklist

Reproduce the shared checklist and mark items appropriately:

- [ ] Confirm agent configs use least-privilege access.  → Check the relevant IAM or bot settings.
- [ ] Validate pipeline runs clean and matches expected outputs. → Link to the CI job or attach the console snippet.
- [ ] Review dependencies + build logs for anything unexpected. → Note the outcome (e.g., "No warnings" or "Investigating eslint warning").
- [ ] Deploy to staging or target branch once cleared. → State who owns the deploy and target window.

Update the boxes to `[x]` as you complete them. Leave unchecked if pending, and add an owner or ETA inline when possible.

## 5. Provide evidence and links

Strengthen your response by attaching:

- Direct links to CI runs, staging environments, or dashboards.
- Short bullet lists summarizing key findings (e.g., "✅ Terraform plan clean" / "⚠️ Waiting on QA scenario 4").
- Any remediation steps taken for issues discovered during the sweep.

## 6. Example response

```
**Context:** Adds role-based dashboard filters so customer success can scope metrics by region.
**Security sanity:** Checked `.env`, GitHub secrets, and Terraform vars—no plaintext creds. Rotated the preview token after testing.
**Tests:** `pnpm test`, `pnpm lint`, `terraform plan` (all green). Manual smoke test in staging covers auth + permissions.
**Merge plan:** Merge after @Reviewer signs off; deploy during Wednesday maintenance window with feature flag `dashboardFilters` enabled.

— Optional Ops/Infra Add-On —
Security sweep: trufflehog + `detect-secrets` both clean.
Dependency freeze: No lockfile drift; Renovate pin remains intact.
CI/CD check: GitHub Actions ↔ staging runners match (`node@18`).
Telemetry watch: Observing Datadog dashboard `dashboards/cs-funnels` for 1 hour post-release.

— Next steps —
- [x] Confirm agent configs use least-privilege access.
- [x] Validate pipeline runs clean and matches expected outputs.
- [ ] Review dependencies + build logs for anything unexpected (waiting on build artifacts from nightly job).
- [ ] Deploy to staging or target branch once cleared (scheduled for Wed 14:00 UTC).
```

## 7. Continuous improvement

- Encourage teammates to paste this template into their own notes or scripts.
- After each incident or deploy, update this guide with lessons learned (e.g., new tools to run, extra checkboxes to add).
- Pair newer contributors with an experienced reviewer at least once so they can walk through filling the template together.

By following these steps, every contributor can quickly deliver a thorough, confidence-building response to the blanket comment—no guesswork required.
