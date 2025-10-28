### Summary

- Hardened API server with strict CORS allowlist, helmet, rate limiting, body size limits, and structured logging.
- Provided `.env.sample` and Jest smoke tests for health and security headers.
- Moved legacy configs and environment files to `/_trash`.
- Removed deprecated `.eslintrc.cjs` and stray `.env.aider` from repo root.
- Consolidated lint/format configs; migrated service-level duplicates to `/_trash` and introduced repo-wide `.eslintrc.cjs`.

### Mainline Auto-Heal Automation

- **Trigger**: Runs automatically on every push to the `main` branch.
- **What happens**: The workflow checks out a fresh `automation/mainline-cleanup` branch, executes `bash fix-everything.sh`, and uploads the generated `.justfix-summary.md` report as an artifact. When the script makes changes, it prepares a commit that mirrors the existing auto-heal logic and uses `peter-evans/create-pull-request` to open or update the “Mainline Cleanup” PR.
- **Expected outputs**: A reusable “Mainline Cleanup” pull request containing the automated fixes plus an attached `.justfix-summary.md` artifact detailing what was touched.
- **Rollback**: Disable or remove `.github/workflows/mainline-autoheal.yml`, close the “Mainline Cleanup” PR, and delete the `automation/mainline-cleanup` branch if it persists.
<!-- FILE: CLEANUP_RESULTS.md -->

### Summary

- Hardened API with helmet, rate limiting, strict CORS, body-size limits, and JSON request logging.
- Added `.env.sample` with required vars and fail-fast checks.
- Introduced Jest smoke tests for health and security headers.
- Removed unused branding assets from the SPA and added a formatting script.

### SPA Asset Changes

- **Before:**
  - `assets/brand/README.md`
  - `assets/brand/brand-sprite.svg`
  - `assets/brand/brand.css`
  - `assets/brand/browserconfig.xml`
  - `assets/brand/build_brand_assets.sh`
  - `assets/brand/favicon.svg`
  - `assets/brand/humans.txt`
  - `assets/brand/icons/.gitkeep`
  - `assets/brand/logo-wordmark.svg`
  - `assets/brand/logo.svg`
  - `assets/brand/og-image.svg`
  - `assets/brand/robots.txt`
  - `assets/brand/safari-pinned-tab.svg`
  - `assets/brand/site.webmanifest`
  - `assets/brand/theme.js`
  - `assets/brand/wordmark.svg`
- **After:** directory removed; contents moved to `/_trash/var/www/blackroad/assets`.

### Verification Commands

- `npm run format:check`
- `npm run lint`
- `npm test`
- `pytest srv/lucidia-llm/test_app.py`
- `curl -I http://localhost:4000/health`
- `curl -I http://localhost:4000/api/health`
