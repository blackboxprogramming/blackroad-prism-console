# Cleanup Decisions

## Tooling

- **JavaScript/Node:** Node 20.x using **CommonJS** modules.
- **Formatting:** Prettier (single quotes, semicolons, 80‑column print width).
- **Linting:** ESLint with recommended and security rules.
- **Testing:** Jest for Node API; Pytest for Python `app.py`.
- **Pre-commit:** Husky + lint-staged running format, lint, and tests.

## Configuration Baselines

- `.editorconfig` defining UTF‑8, LF, 2‑space indents.
- `.prettierrc.json` with repo-wide defaults; mirrored in `var/www/blackroad/`.
- `.eslintrc.cjs` as sole ESLint config; `.eslintignore` to skip `/_trash/` and build outputs.
- `package.json` scripts: `dev`, `start`, `format`, `format:check`, `lint`, `test`, `typecheck`, `health`.

## Security Enhancements

- Enable `helmet`, `express-rate-limit`, and structured logging (request ID, method, path, status, duration).
- CORS allowlist from `ALLOW_ORIGINS` env (comma-separated); default to none.
- Enforce cookie-session flags: `httpOnly`, `secure` (when `NODE_ENV=production`), `sameSite='lax'`.
- Input validation via `express-validator` for critical endpoints (`/api/login` etc.).
- Body size limits (`express.json({limit: '1mb'})`).
- Fail-fast checks for required env vars; provide `.env.sample` with documented placeholders.

## Trash Policy

- Files deemed dead or obsolete are **moved** to `/_trash/<original_path>`.
- Each trash subfolder receives a `README.md` explaining origin and reason.
- This preserves history and allows easy restoration.

## DevEx & CI

- Add `Makefile` with `install`, `dev`, `start`, `format`, `lint`, `test`, `health`, `migrate`, `clean`.
- Configure Husky pre-commit hook to run `lint-staged` and `npm test`.
- New GitHub Action: `.github/workflows/ci.yml` executing format check, lint, Jest tests, and Pytest.

## Testing Strategy

- Jest smoke tests:
  1. `/health` and `/api/health` return `200` with JSON payload.
  2. Security headers (`helmet`, CORS) present on `/api/health`.
  3. Login route validates payload.
- Pytest: ensure `app.py` health endpoint returns OK.
