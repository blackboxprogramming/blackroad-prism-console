# HJB Lab — Getting Started

The Hamilton–Jacobi–Bellman Control Lab ships an end-to-end playground for continuous and discrete
control. This guide covers CLI workflows, GraphQL access, and the new UI page.

## 1. Solve from the CLI

1. Create a configuration file (e.g. `configs/hjb/pde.single.json`):

   ```json
   {
     "mode": "pde",
     "outputDir": "artifacts/hjb/pde",
     "pde": {
       "grid": { "shape": [41, 41], "spacing": [0.1, 0.1], "origin": [-2, -2] },
       "dynamics": { "type": "single_integrator", "options": { "dimension": 2, "controlLimit": 2 } },
       "cost": { "type": "quadratic", "stateWeights": [1, 1], "controlWeights": [1, 1] },
       "tolerance": 1e-3,
       "damping": 0.3
     },
     "rollout": { "start": [1.2, -0.8], "steps": 400, "dt": 0.05 }
   }
   ```

2. Run the solver:

   ```bash
   blackroadctl control hjb-solve --config configs/hjb/pde.single.json
   ```

   Artifacts (`V.csv`, `policy.csv`, `quiver.png`, `rollout.webm`) land in `artifacts/hjb/pde`.

3. Replay a rollout with tweaked initial conditions:

   ```bash
   blackroadctl control hjb-rollout \
     --config configs/hjb/pde.single.json \
     --start 0.5,0.5 --steps 300 --dt 0.04 --out artifacts/hjb/pde/what-if
   ```

## 2. GraphQL Mutations

The `@blackroad/hjb-gateway` exposes three mutations:

- `hjbSolvePDE(config: JSON!): HJBJob!`
- `hjbSolveMDP(config: JSON!): HJBJob!`
- `hjbRollout(jobId: ID!, start: [Float!]!, steps: Int, dt: Float): Artifact!`

Example call (using `graphql-request`):

```ts
import { request, gql } from 'graphql-request';

const mutation = gql`
  mutation Solve($config: JSON!) {
    hjbSolvePDE(config: $config) { id status metrics artifacts { name path } }
  }
`;

const job = await request('https://gateway.local/graphql', mutation, { config });
```

Jobs emit spans (`hjb.gateway.pde`, `hjb.gateway.mdp`, `hjb.rollout.sim`) for observability. All
mutations require an operator or admin role.

## 3. Inspect in the UI

Navigate to `/labs/HJBLab` on the BlackRoad site. The page includes:

- Preset switcher (`🧭` single integrator, `🧱` double integrator, `🛣️` Dubins car).
- Mode toggle (PDE vs MDP) with helper prompts (`🧪`, `⚖️`).
- Quiver canvas showing value gradients and policy arrows.
- Trajectory player with time slider and state/control readout.
- Artifact viewer and chat panel seeded with `/rerun` and boundary reflection messages.

The page uses the shared `ArtifactViewer` and `ChatPanel` components, so it fits naturally into the
existing lab ecosystem.

## 4. Determinism Checklist

- Control grids are generated with fixed resolution and ordering.
- Rollouts seed deterministic PRNGs; exported JSON is stable between runs.
- CLI commands close telemetry spans via `endTelemetry` to avoid dangling sessions.

## 5. Next Steps

- Swap the quiver text serialization for PNG rendering once the image toolkit lands.
- Surface GraphQL subscription events in the UI to mirror live job updates.
- Extend the rollout CLI to read `policy.csv` directly, enabling offline replays.
