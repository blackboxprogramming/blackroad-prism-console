# Schrödinger Bridge — Getting Started

Welcome to the entropy-powered optimal transport lab. This guide covers the three entry points for running a bridge:

1. **Engine API (`@blackroad/sb-engine`)** for direct programmatic access.
2. **CLI (`blackroadctl ot sb-run`)** for headless runs on the control plane.
3. **Gateway (`@blackroad/sb-gateway`)** for GraphQL orchestration and subscriptions.

## 1. Install dependencies

```bash
pnpm install
pnpm --filter @blackroad/sb-engine build
```

## 2. Prepare distributions

Distributions are stored as JSON files with points (2D coordinates) and weights:

```json
{
  "points": [[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]],
  "weights": [0.2, 0.5, 0.3]
}
```

Keep weights non-negative and normalised. The CLI will normalise if needed but deterministic runs assume pre-normalised weights.

## 3. Headless run

```bash
blackroadctl ot sb-run \
  --mu fixtures/ot/source.json \
  --nu fixtures/ot/target.json \
  --eps 0.05 \
  --iters 600 \
  --tol 1e-4 \
  --cost l2 \
  --out artifacts/sb/runs
```

Outputs include:

- `pi.npz` — coupling matrix in NumPy format.
- `map.png` — barycentric map heatmap.
- `frames.webm` — JSON encoded interpolation frames.
- `diagnostics.json` — marginal residual, primal cost, KL.
- `job.json` + `result.json` — metadata for follow-up commands.

Generate additional frames:

```bash
blackroadctl ot sb-frames \
  --job artifacts/sb/runs/<job-id> \
  --t 0.0,0.25,0.5,0.75,1.0
```

## 4. GraphQL workflow

```graphql
mutation RunBridge($mu: String!, $nu: String!, $eps: Float!) {
  sbRun(mu: $mu, nu: $nu, eps: $eps) {
    id
    status
    metrics
    artifacts { name path }
  }
}
```

Subscribe to progress:

```graphql
subscription OnBridge($jobId: ID!) {
  sbEvents(jobId: $jobId) {
    id
    status
    metrics
  }
}
```

Artifacts are persisted under `artifacts/sb/<job-id>`.

## 5. Labs UI

Visit `/labs/SBLab` in the BlackRoad site to explore ε, cost functions, and barycentric visuals. The tuner mirrors CLI defaults and
provides teaching prompts for reflection sessions.

## 6. Telemetry

- Spans emitted: `sb.sinkhorn`, `sb.sinkhorn.iter`.
- Metrics: `sb_sinkhorn_iterations`, `sb_sinkhorn_marginal_error`.
- Logs redact tokens automatically (see `sb-gateway/src/auth/rbac.ts`).

## 7. Determinism checklist

- Fix ε, iterations, tolerance, cost metric.
- Use the same tiling (default row-major) and ensure identical input ordering.
- Regenerate artifacts via `sb-frames` only when new `t` samples are required; the base coupling remains unchanged.
