# Branch Protections

Protect `main` (and `develop` if used):
- Require PR reviews (minimum 1; suggest 2 on `main`)
- Require status checks: CI/build, CodeQL, Gitleaks
- Dismiss stale approvals on new commits
- Restrict who can push: maintainers only
- (Optional) Require signed commits

Org-level:
- Enforce 2FA
- Enable Secret Scanning + Push Protection
- Enable Dependabot alerts
