# Branch Protection — BlackRoad (template)

Apply these in **GitHub → Settings → Branches → Branch protection rules** for `main`:

1. **Require a pull request before merging**
   - Require approvals: **2**
   - Dismiss stale approvals on new commits: **on**
   - Require review from Code Owners: **on**
   - Block force pushes: **on**
   - Block deletions: **on**
2. **Require status checks to pass before merging**
   - Required checks (examples):
     - CI • Node 20 (lint/typecheck/test)
     - Miners • Validate
     - Security • gitleaks
3. **Require conversation resolution before merging:** **on**
4. **Require linear history:** optional but recommended
5. **Require signed commits:** recommended (if your team can support it)
6. **Enforce for administrators:** **on** (recommended)

Org-level:
- Enforce **2FA** for all members.
- Use SSO/SCIM if available.
- Rotate team permissions quarterly.

## When status checks fail

- **Do not close and reopen PRs** just to retrigger automation. Leave the PR
  open, investigate the failing job, and push a fix.
- **Skip the @codex spam.** Posting repeated "please merge" comments in Linear
  or on the PR does not bypass branch protection. Resolve the underlying CI
  failure first.
- **Reproduce locally.** Run the same commands that failed in CI (`npm run
  build`, `npm run lint`, `npm run typecheck`, `node scripts/health-check.js`,
  etc.) until they pass.
- **Communicate status changes.** Once the fix is ready and checks are green,
  update Linear or Slack with the resolution and request a review if needed.
