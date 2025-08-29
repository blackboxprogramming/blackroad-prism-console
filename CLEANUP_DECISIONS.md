<!-- FILE: CLEANUP_DECISIONS.md -->
# Cleanup Decisions

## Tooling
- **JavaScript/Node:** Node 20.x using **CommonJS** modules.
- **Formatting:** Prettier (single quotes, semi‑colons, 80‑column print width).
- **Linting:** ESLint with recommended + security rules.
- **Testing:** Jest for Node API; Pytest for Python `app.py`.
- **Pre-commit:** Husky + lint‑staged running format, lint, and tests.

## Configuration Baselines
- `.editorconfig` defining UTF‑8, LF, 2‑space indents.
- `.prettierrc` shared across repo; `.prettierignore` for generated assets.
- `.eslintrc.cjs` as sole ESLint config; `.eslintignore` to skip `/_trash/` and build outputs.
- `package.json` scripts: `dev`, `start`, `format`, `lint`, `test`, `health`, `typecheck` (noop), etc.

## Security Enhancements
- Enable `helmet`, `express-rate-limit`, and structured logging (request ID, method, status, duration).
- CORS allowlist from `ALLOW_ORIGINS` env (comma-separated); default to none.
- Enforce cookie-session flags: `httpOnly`, `secure` (when `NODE_ENV=production`), `sameSite='lax'`.
- Input validation via `express-validator` for critical endpoints (`/api/login`, billing routes).
- Body size limits (e.g., `express.json({limit: '1mb'})`).
- Fail-fast checks for required env vars; provide `.env.sample` with documented placeholders.

## Trash Policy
- Files deemed dead or obsolete are **moved** to `/_trash/<original_path>`.
- Each trash subfolder receives a `README.md` explaining origin and reason.
- This preserves history and allows easy restoration.

## DevEx & CI
- Add `Makefile` with `install`, `dev`, `start`, `format`, `lint`, `test`, `health`, `clean`.
- Configure Husky pre-commit hook to run `npm test` (fast) + `eslint --fix` + `prettier`.
- New GitHub Action: `.github/workflows/ci.yml` executing format check, lint, Jest tests, and Pytest.

## Testing Strategy
- Jest smoke tests:
  1. `/api/health` returns `200` with JSON payload.
  2. Security headers (`helmet`, CORS) present on a sample route.
  3. Core login route responds correctly.
- Pytest: ensure `app.py` loads and `/health` endpoint returns OK.
