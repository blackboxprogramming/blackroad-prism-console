# BlackRoad Prism Console

🔒 Mirrored & indexed for Lucidia (BlackRoad). Upstream MIT.

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

## Experiments & Funnels

### Flip experiments (ChatOps)
Comment on any PR/Issue:

```
/exp set <id> active on|off weights A=<num> B=<num>
```

This edits `sites/blackroad/public/experiments.json`, commits, and pushes.

### Manage funnels (ChatOps)

```
/funnel set "Signup" window 14 steps cta_click,portal_open,signup_success
```

This edits `sites/blackroad/public/funnels.json`.

### Experiments dashboard
- Visit **/experiments** to preview experiments and generate the exact ChatOps command.

### Per-variant lift
- Conversions automatically include your A/B assignments (cookie `br_ab`) in `meta.ab`.
- **/metrics** shows A vs B counts and naïve rates per conversion id, plus **lift**.

### Funnels analytics
- Configure `public/funnels.json`. **/metrics** computes per-step counts, step rate, and cumulative rate (last 30 days).
- For very high volumes, move aggregation to the Worker/Durable Objects.

### Quick use

Flip an experiment:

```
/exp set new_nav active on weights A=0.4 B=0.6
```

Add a funnel:

```
/funnel set "Docs Journey" window 10 steps home_view,docs_view,docs_search,docs_copy_snippet
```

Record extra conversions from code:

```ts
import { recordConversion } from '@/lib/convert'
recordConversion('portal_open')
recordConversion('signup_success', 1, { plan: 'pro' })
```
