### Summary

- Hardened API server with /health endpoint, helmet, CORS allowlist, rate limiting, and request logging.
- Added `.env.sample`, Jest/Pytest smoke tests, Makefile, and CI workflow.
- Moved legacy configs and environment files to `/_trash`.
- Removed deprecated `.eslintrc.cjs` and stray `.env.aider` from repo root.
- Consolidated lint/format configs; migrated service-level duplicates to `/_trash` and introduced repo-wide `.eslintrc.cjs`.

### Mainline Auto-Heal Automation

- **Trigger**: Runs automatically on every push to the `main` branch.
- **What happens**: The workflow checks out a fresh `automation/mainline-cleanup` branch, executes `bash fix-everything.sh`, and uploads the generated `.justfix-summary.md` report as an artifact. When the script makes changes, it prepares a commit that mirrors the existing auto-heal logic and uses `peter-evans/create-pull-request` to open or update the “Mainline Cleanup” PR.
- **Expected outputs**: A reusable “Mainline Cleanup” pull request containing the automated fixes plus an attached `.justfix-summary.md` artifact detailing what was touched.
- **Rollback**: Disable or remove `.github/workflows/mainline-autoheal.yml`, close the “Mainline Cleanup” PR, and delete the `automation/mainline-cleanup` branch if it persists.

### Verification Commands

- `npm run format:check`
- `npm run lint`
- `npm test`
- `pytest srv/lucidia-llm/test_app.py`
- `curl -I http://localhost:4000/health`
- `curl -I http://localhost:4000/api/health`
