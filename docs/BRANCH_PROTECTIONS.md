# Branch Protections for `main`

Use this checklist to keep the `main` branch locked behind the quality gates that the automation
bundle expects. These settings live under **Settings → Branches → Branch protection rules** in the
GitHub repository.

## Required checks
- **Require a pull request before merging.** Set the required approvals to at least one reviewer from
the code owners list.
- **Dismiss stale pull request approvals when new commits are pushed.** This keeps reviews aligned
  with the latest diff.
- **Require status checks to pass before merging.** Enable the following checks (they must already be
  reporting in GitHub Actions):
  - `CI / build`
  - `CodeQL`
  - `Gitleaks`
- *(Optional but recommended)* **Require branches to be up to date before merging.** Use this if the
  repository regularly sees conflicting migrations or schema changes.

## Push restrictions
- **Restrict who can push to matching branches.** Limit direct pushes to the automation service
  accounts and the release managers listed in the change management roster.
- **Restrict who can dismiss pull request reviews.** Keep this scoped to the security engineering
  group so approvals cannot be bypassed.

## Advanced hardening
- **Require signed commits.** Enable this once the team has completed GPG/SSH signing onboarding.
  Reference the signing quick-start in `docs/SECURITY_BASELINE.md` for tooling setup.
- **Require linear history.** Only enable this if the deployment tooling already guarantees
  fast-forward merges; otherwise merge queues may fail unexpectedly.
- **Lock branch.** Use only during incident response when you need to temporarily prevent merges.

Document any deviations from this baseline in `docs/CHANGE_MGMT.md` so auditors understand why the
protections differ from the default posture.
