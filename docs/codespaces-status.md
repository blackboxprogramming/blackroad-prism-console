# Codespaces bring-up & reality check

This repository already contains the pieces for a local preview stack, but none of
it will run automatically inside a fresh Codespace unless you follow the bring-up
steps below. The checklist is split by concern so you can verify what exists and
what is still aspirational.

## 1. Prerequisites inside a Codespace

1. Ensure your environment is on **Node.js 20+** – that is what the bundle
   expects. You can confirm and install the right version with:
   ```bash
   nvm install 20
   nvm use 20
   ```
   The bundle fails fast if Node is older than 18, and the README calls out
   Node 20 as the baseline.
2. Install the root dependencies (API + shared tooling):
   ```bash
   npm install
   ```
3. Install the marketing site dependencies (Vite app under `sites/blackroad`):
   ```bash
   npm --prefix sites/blackroad install
   ```
4. Optional but recommended: run the health probe so you have quick feedback on
   missing services:
   ```bash
   bash tools/verify-runtime.sh
   ```

## 2. Bringing up the web properties

### Marketing site (`sites/blackroad`)

This is a Vite/React single-page app. To preview it inside a Codespace:

```bash
npm run dev:site
```

The script runs `npm --prefix sites/blackroad run dev`, which starts Vite on the
default port (usually 5173). Use the Codespaces port forwarding UI to open it in
your browser. Any Markdown added under `sites/blackroad/content/blog/` will be
folded into the build when you rerun `npm run dev:site` or `npm --prefix
sites/blackroad run build`.

### Web console / API (`srv/blackroad-api`)

The backend is an Express app with SQLite, Socket.IO, and Stripe stubs. Before
starting it you **must** provide a few secrets:

```bash
cat <<'ENV' > srv/blackroad-api/.env
SESSION_SECRET=$(openssl rand -hex 32)
INTERNAL_TOKEN=$(openssl rand -hex 32)
PORT=4000
DB_PATH=$(pwd)/srv/blackroad-api/blackroad.db
LLM_URL=http://127.0.0.1:8000/chat
BILLING_DISABLE=true
ENV
```

Then launch the API:

```bash
node srv/blackroad-api/server_full.js
```

Use `npx nodemon srv/blackroad-api/server_full.js` if you want reloads. The
process expects to bind on port 4000. The `tools/verify-runtime.sh` helper
will confirm when the `/health` endpoint is responding. If you also need the
stubbed LLM, follow the hint printed by the installer (`srv/lucidia-llm` with
`uvicorn app:app --host 127.0.0.1 --port 8000`).

## 3. Payments & monetization reality check

Stripe integration code exists, but nothing is wired for real billing until you
supply live keys. The API exits on startup if `SESSION_SECRET` or
`INTERNAL_TOKEN` are missing, and it only instantiates a Stripe client when
`STRIPE_SECRET` is set. Leave `BILLING_DISABLE=true` while developing so routes
skip charge attempts. When you are ready to exercise payments, inject the
complete key set listed in the README (`STRIPE_*` prices + webhook secret) and
point your Stripe CLI at `/api/stripe/webhook`.

## 4. Blockchain & miner expectations

There is **no** autonomous mining or blockchain node baked into the Codespace.
The `miners/miners-compose.yml` file provides two educational docker-compose
services that throttle CPU usage and require you to point at an external pool.
They remain idle until you explicitly run:

```bash
docker compose -f miners/miners-compose.yml up -d ltc-cpuminer
# or
docker compose -f miners/miners-compose.yml up -d cpuminer-multi
```

These containers are intentionally low power and are meant for learning, not
profitable mining. They do not interact with the web stack unless you build that
bridge yourself.

## 5. What is *not* implemented today

- No hosted blockchain node, ledger, or miner is provisioned by default.
- No RIA/compliance automation ships in this repo; those processes still need to
  be run manually outside of code.
- Production deployment is **not** automatic. Shipping still requires you to run
  the ops scripts (`ops/install.sh` on a server and the cache/deploy chatops
  commands) or wire up CI/CD yourself.

Following this checklist should convert the "nothing is working" experience into
explicit pass/fail signals for each layer so you can see what is already in the
repo and where additional engineering effort is required.
