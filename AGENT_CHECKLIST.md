# Agent checklist — pre-PR commands and expectations

Use this checklist before opening a PR (especially for automated agents):

1. Bootstrap and install

````bash
2) If you added imports in a package (server or site)

```bash
3) Run tests and lint

```bash
4) Runtime verification (optional but recommended)

```bash
5) Env vars and secrets

- Do not rename or remove existing vars in `srv/blackroad-api/.env.example`.
- If you add vars, append them to `srv/blackroad-api/.env.example` with a sensible default and a short comment.
- Never commit secrets. If you find secrets in history/files, pause and notify a human reviewer.

6) PR meta
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`.
- Keep each branch a single conceptual change.
- In the PR description, paste the checklist from `.github/PULL_REQUEST_TEMPLATE.md` and the commands you ran.

Helpful references
- API entry & middleware: `srv/blackroad-api/server_full.js`
- Env canonical: `srv/blackroad-api/.env.example`
- Bootstrap & deps: `ops/install.sh`, `tools/dep-scan.js`, `tools/verify-runtime.sh`
- Automation & agents: `codex/`, `scripts/`, `tools/`

# Agent checklist — pre-PR commands and expectations

Use this checklist before opening a PR (especially for automated agents):

1) Bootstrap and install

```bash
bash ops/install.sh
````

2. If you added imports in a package (server or site)

```bash
# run the dep-scan tool for the affected package dir and save changes
node tools/dep-scan.js --dir <package/path> --save
# stage only the package.json / lockfile changes produced by the tool
git add package.json package-lock.json yarn.lock pnpm-lock.yaml
```

3. Run tests and lint

```bash
npm test
npm run lint
```

4. Runtime verification (optional but recommended)

```bash
npm run health
bash tools/verify-runtime.sh
```

5. Env vars and secrets

- Do not rename or remove existing vars in `srv/blackroad-api/.env.example`.
- If you add vars, append them to `srv/blackroad-api/.env.example` with a sensible default and a short comment.
- Never commit secrets. If you find secrets in history/files, pause and notify a human reviewer.

6. PR meta

- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`.
- Keep each branch a single conceptual change.
- In the PR description, paste the checklist from `.github/PULL_REQUEST_TEMPLATE.md` and the commands you ran.

Helpful references

- API entry & middleware: `srv/blackroad-api/server_full.js`
- Env canonical: `srv/blackroad-api/.env.example`
- Bootstrap & deps: `ops/install.sh`, `tools/dep-scan.js`, `tools/verify-runtime.sh`
- Automation & agents: `codex/`, `scripts/`, `tools/`

## Quick-gates script & CI

I added an opinionated, fast quality-gates script at `scripts/quick_quality_gates.sh` and a workflow `.github/workflows/quick-gates.yml` that runs it on PRs and pushes to `main`.

Run it locally:

```bash
bash scripts/quick_quality_gates.sh
```

AGENT CHECKLIST — BlackRoad Prism Console

## Purpose

Small, copyable checklist agents should run locally before creating a PR. These commands are intentionally conservative and non-destructive.

## Quick pre-PR steps

1. Bootstrap / install deps (repo root):

   bash ops/install.sh

2. If you modified server imports, run dep-scan in the API dir and commit only tool output:

   node tools/dep-scan.js --dir srv/blackroad-api --save

3. Run tests and lint for the API (from API dir):

   cd srv/blackroad-api
   npm test
   npm run lint

4. Run a quick runtime health check (root):

   npm run health
   bash tools/verify-runtime.sh

## Optional smoke runs

- Start API (dev) and hit health endpoints:

  cd srv/blackroad-api && npm run dev

  # In another terminal

  curl -i http://localhost:4000/health
  curl -i http://localhost:4000/api/health

- If you rely on LLMs locally, ensure LLM stub is reachable (default: http://127.0.0.1:8000/health):

  curl -i http://127.0.0.1:8000/health

## Quality gates script (fast)

Run the following from repo root to perform quick CI-like checks. It exits non-zero on failures.

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "Running quick quality gates..."
bash ops/install.sh
cd srv/blackroad-api
npm test --silent
npm run lint --silent
echo "OK: tests and lint passed"
cd - >/dev/null
npm run health || (echo "health check failed"; exit 2)
echo "All quick checks passed"
```

## Notes & rules (summary)

- Do not change env var names. If new envs are required, append them to `srv/blackroad-api/.env.example`.
- After adding imports, run `tools/dep-scan.js` and commit only the package changes it produces.
- Avoid committing secrets. Use env files or secret managers for local testing.

If you'd like, I can add this script as `scripts/quick_quality_gates.sh` (executable) and a small GitHub Action that runs it on PRs. Reply "add quick-gates script" to have me create it.
