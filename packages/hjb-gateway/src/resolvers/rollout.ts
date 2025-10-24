import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';
import { simulateRollout } from '@blackroad/hjb-engine';
import type { DynamicsContext, CostContext, Grid, Vector } from '@blackroad/hjb-engine';
import type { GatewayContext, HjbJobStore } from './types.js';
import { assertCanMutate } from '../auth/rbac.js';

interface PdeJobData {
  kind: 'PDE';
  policy: Vector[];
  grid: Grid;
  dynamics: DynamicsContext;
  cost?: CostContext;
}

interface MdpJobData {
  kind: 'MDP';
  states: Vector[];
  policy: Vector[];
  dynamics: DynamicsContext;
  cost?: CostContext;
  dt: number;
}

function nearest(grid: Grid, state: Vector): number {
  const { shape, spacing, origin } = grid.spec;
  let index = 0;
  for (let dim = 0; dim < shape.length; dim += 1) {
    const coord = Math.round((state[dim] - origin[dim]) / spacing[dim]);
    const clamped = Math.max(0, Math.min(shape[dim] - 1, coord));
    index = index * shape[dim] + clamped;
  }
  return index;
}

function nearestFromStates(states: Vector[], state: Vector): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < states.length; i += 1) {
    let distance = 0;
    for (let j = 0; j < state.length; j += 1) {
      const diff = states[i][j] - state[j];
      distance += diff * diff;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

export function runRollout(store: HjbJobStore, jobId: string, start: number[], steps: number, dt: number, context: GatewayContext) {
  assertCanMutate(context);
  const job = store.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  const data = store.getData<PdeJobData | MdpJobData>(jobId);
  if (!data) {
    throw new Error(`Job ${jobId} missing rollout context`);
  }

  let policyFn: (state: number[]) => number[];
  let dynamics;
  let cost;
  if (data.kind === 'PDE') {
    policyFn = (state) => {
      const index = nearest(data.grid, state);
      return data.policy[index].slice();
    };
    dynamics = data.dynamics;
    cost = data.cost;
  } else {
    policyFn = (state) => {
      const index = nearestFromStates(data.states, state);
      return data.policy[index].slice();
    };
    dynamics = data.dynamics;
    cost = data.cost;
  }

  const result = simulateRollout({
    dynamics: dynamics as any,
    policy: policyFn,
    start,
    dt,
    steps,
    cost: cost as any
  });

  const artifactCount = job.artifacts.filter((artifact) => artifact.name.startsWith('rollout')).length;
  const artifactName = `rollout-${artifactCount + 1}.webm`;
  const artifactPath = join(tmpdir(), `${job.id}-${artifactName}`);
  writeFileSync(artifactPath, Buffer.from(JSON.stringify(result, null, 2)));

  const updatedArtifacts = [...job.artifacts, { name: artifactName, path: artifactPath }];
  store.update(job.id, { artifacts: updatedArtifacts });

  return { name: artifactName, path: artifactPath };
}
