# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Conversions (end-to-end)
**Worker API**
- `POST /convert` — body: `{ id: "signup_click", value?: 1.0, ts?: ISO, route?, uid?, meta? }`
- `GET /conversions?since=YYYY-MM-DD&limit=1000` — returns top IDs, day rows, totals
- Auth: if you set `ERROR_API_KEY` secret/var, include header `x-api-key: <key>` from the client.

**Site**
- Set `VITE_ANALYTICS_BASE="https://<worker>.workers.dev"`.
- Use `recordConversion('cta_click', 1, { where: 'home.hero' })`.
- Charts appear on **/metrics** (Conversions section).

**Notes**
- Storage window: logs 14 days, conversions 30 days (KV TTL).
- Aggregation is computed on read; for very high volume, consider Durable Objects / D1.

### How to use (right now)
1. In Cloudflare:
   - Make sure the KV namespace (ERROR_LOGS) exists and your Deploy CF Worker workflow is green.
   - Set repo vars: ERROR_LOGS_KV_ID. Optional: ERROR_API_KEY to require write auth.
2. In your site env (Vite):
   - `VITE_ANALYTICS_BASE=https://<your-worker>.workers.dev`
3. Fire a test conversion:
   - Hit the Home page and click “Demo: Record Conversion”.
   - Open `/metrics` → Conversions should light up with `cta_click`.
