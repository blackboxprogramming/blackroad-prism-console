# CODEx: Fix Anything Failing — Elaborated, Battle-Hardened Playbook

> Goal: **Green CI + Working Site + Happy Bots** without human babysitting.  
> Contract: _Never block shipping due to tooling noise. Create missing pieces. Skip-safe by default._

---

## 0) Guardrails & Flags (always read first)

- Honor feature flags in `.github/feature-flags.yml`:
  - `ai_tools`, `security_scans`, `heavy_linters`, `web_performance`
- If a scan/tool is missing or secret is absent → **skip**, **log**, **continue**.
- Respect **Emergency Ship**: if file `.ship/override` exists → **do not fail** any non-build jobs.

---

## 1) Stack Detect & Bootstrap

- **Node/React** (root and `sites/blackroad`):
  - Run `npm ci || npm i --package-lock-only`
  - Ensure scripts: `build`, `dev`, `format`, `lint`; add if missing.
  - If Vite missing, install `vite` and create `vite.config.js` (React plugin).
- **Python**:
  - If any `*.py`, ensure `requirements.txt` contains `pytest`; create `tests/test_smoke.py`.
- **Go/Rust/TS**:
  - Go: ensure `go.mod`, run `go vet ./... || true`, `go test ./... || true`
  - Rust: add `rustfmt/clippy` runs as **advisory**.
  - TS: ensure `tsconfig.json` (`strict:true`).

Commit any created files immediately with message `chore(bootstrap): ensure minimal toolchain`.

---

## 2) Formatting & Linting (never block)

- Ensure `.prettierrc.json`, `.prettierignore`, `eslint.config.js` (enable TS if used).
- Run:
  - `npx prettier -w .`
  - `npx eslint . --ext .js,.jsx,.ts,.tsx --fix || true`
- If ESLint config missing rules/plugins, **generate a minimal flat config**.

Commit with `chore(format): prettier/eslint autofix`.

---

## 3) Build Reliability

- **Vite/React** build must pass:
  - Create placeholder assets for any missing imports (svg/png/json).
  - Inject SPA fallback (`404.html`) and `_redirects` where appropriate.
  - If Tailwind referenced but not installed → **remove Tailwind usage** (fallback CSS) OR auto-add Tailwind config and minimal CSS. Prefer **fallback CSS** to keep deterministic.

Commit with `fix(build): stabilize vite react build`.

---

## 4) Tests (smoke by default)

- **Node**: if no tests, create `tests/smoke.test.js` with one passing assertion; add `"test":"node -e \"console.log('ok')\""` if no test runner.
- **Python**: basic pytest smoke.
- Mark tests **advisory** in CI unless explicitly enabled by flag `heavy_linters:true`.

Commit with `test(smoke): add baseline`.

---

## 5) Site Integrity & Routing

- Ensure router provides pages: `/`, `/docs`, `/status`, `/snapshot`, `/portal`, `/playground`, `/contact`, `/tutorials`, `/roadmap`, `/changelog`, `/blog`, and 404.
- Add **ErrorBoundary** and client-side 404 friendly page.
- Generate `sitemap.xml` & `robots.txt` (job already exists, keep in sync with routes).

Commit with `feat(site): complete page map + 404 + error boundary`.

---

## 6) Co-Coding Portal Resilience

- Load Monaco lazily; fallback to `<textarea>`.
- Save content in `localStorage`.
- Optional collab via `VITE_YJS_WS`; if not set, **do not error**.
- Provide **starter templates** dropdown (Node/Python/HTML/SQL/Markdown).

Commit with `feat(portal): templates + robust fallback`.

---

## 7) Docs & Playbooks (human-readable)

- Add/refresh:
  - `docs/ops-playbook.md` (runbooks + quick tasks)
  - `docs/troubleshooting.md` (common build failures & cures)
  - `docs/flags.md` (feature flags behavior)
  - `CHANGELOG.md` (create if missing)
  - `docs/roadmap.json` (milestones for roadmap page)
- Ensure README quickstart commands match reality.

Commit with `docs: ops playbook, troubleshooting, flags, roadmap`.

---

## 8) Link Health & Accessibility (advisory)

- Run link check (lychee) and axe advisory scans.
- Replace or stub broken links in content (e.g., `mailto:` placeholders).

Commit with `chore(ci): lychee/axe advisory fixes`.

---

## 9) Autofix Loop

- If a workflow fails:
  1. Parse logs → detect missing file/config/tool.
  2. Create/patch accordingly (idempotent).
  3. Re-run affected job or push fix.
  4. Update a PR task list with ✔ progress.

Commit with `fix(ci): remediate <tool> failure`.

---

## 10) Exit Criteria

- `sites/blackroad` builds without errors.
- All advisory jobs complete (may warn but not fail).
- Previews (Pages/Vercel/CF) post a URL comment when secrets present.
- Uptime JSON & Screenshot workflows commit artifacts successfully.

> If any step is impossible due to provider limits, **log clearly** and continue. Never leave the repo unbuildable.
