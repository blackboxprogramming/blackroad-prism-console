import { join } from 'path';
import { tmpdir } from 'os';
import { createGrid, iterateGrid, exportArtifacts, valueIteration, extractGreedyPolicy, createSingleIntegrator, createDoubleIntegrator, createDubinsCar, createQuadraticCost, withObstacleCost } from '@blackroad/hjb-engine';
import type { DynamicsContext, CostContext, Vector } from '@blackroad/hjb-engine';
import { withSpan } from '../otel.js';
import type { GatewayContext, HjbJobStore, HjbJob } from './types.js';
import { assertCanMutate } from '../auth/rbac.js';

interface MdpJobData {
  kind: 'MDP';
  states: Vector[];
  actions: Vector[];
  dynamics: DynamicsContext;
  cost: CostContext;
  grid: Grid;
  dt: number;
  policy: Vector[];
}

interface MdpConfig {
  grid: { shape: number[]; spacing: number[]; origin: number[] };
  dynamics: { type: string; options?: Record<string, unknown> };
  cost: Record<string, unknown>;
  discount: number;
  dt: number;
  controlResolution?: number;
}

function createDynamics(config: MdpConfig['dynamics']): DynamicsContext {
  const options = config.options ?? {};
  switch (config.type) {
    case 'single_integrator':
      return createSingleIntegrator({ dimension: (options.dimension as number) ?? 2, controlLimit: (options.controlLimit as number) ?? 3, controlResolution: (options.controlResolution as number) ?? 0.5 });
    case 'double_integrator':
      return createDoubleIntegrator({ positionDimension: (options.dimension as number) ?? 1, controlLimit: (options.controlLimit as number) ?? 2, damping: (options.damping as number) ?? 0.1, controlResolution: (options.controlResolution as number) ?? 0.5 });
    case 'dubins':
      return createDubinsCar({ speed: (options.speed as number) ?? 1, turnRate: (options.turnRate as number) ?? 1, controlResolution: (options.controlResolution as number) ?? 0.25 });
    default:
      throw new Error(`Unsupported dynamics type ${config.type}`);
  }
}

function createCost(config: Record<string, unknown>): CostContext {
  const type = config.type as string;
  if (type === 'quadratic') {
    return createQuadraticCost({
      stateWeights: (config.stateWeights as number[]) ?? [1, 1],
      controlWeights: (config.controlWeights as number[]) ?? [1, 1],
      goal: (config.goal as number[]) ?? undefined
    });
  }
  if (type === 'quadratic_with_obstacles') {
    const base = createQuadraticCost({
      stateWeights: (config.stateWeights as number[]) ?? [1, 1],
      controlWeights: (config.controlWeights as number[]) ?? [1, 1],
      goal: (config.goal as number[]) ?? undefined
    });
    return withObstacleCost({ base, obstacles: (config.obstacles as Array<{ center: number[]; radius: number; weight: number }>) ?? [] });
  }
  throw new Error(`Unsupported cost type ${type}`);
}

function enumerateControls(dynamics: DynamicsContext, resolution?: number): Vector[] {
  const samples = Math.max(1, Math.ceil((dynamics.controlBounds[0][1] - dynamics.controlBounds[0][0]) / Math.max(resolution ?? dynamics.controlResolution ?? 0.5, 0.1)));
  const values: Vector[] = [];
  const control = new Array(dynamics.controlDim).fill(0);
  const recurse = (dim: number) => {
    if (dim === dynamics.controlDim) {
      values.push(control.slice());
      return;
    }
    const [min, max] = dynamics.controlBounds[dim];
    if (samples === 1) {
      control[dim] = Math.max(min, Math.min(max, 0));
      recurse(dim + 1);
      return;
    }
    for (let i = 0; i <= samples; i += 1) {
      const ratio = i / samples;
      control[dim] = min + (max - min) * ratio;
      recurse(dim + 1);
    }
  };
  recurse(0);
  return values;
}

function buildLatticeStates(grid: Grid): Vector[] {
  const states: Vector[] = new Array(grid.size).fill(0).map(() => []);
  iterateGrid(grid, (index, coords, position) => {
    states[index] = position.slice();
  });
  return states;
}

function nearestState(states: Vector[], state: Vector): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < states.length; i += 1) {
    let distance = 0;
    for (let j = 0; j < state.length; j += 1) {
      const diff = states[i][j] - state[j];
      distance += diff * diff;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export async function runMdpJob(store: HjbJobStore, rawConfig: unknown, context: GatewayContext): Promise<HjbJob> {
  assertCanMutate(context);
  const config = rawConfig as MdpConfig;
  const job = store.create('MDP', rawConfig);
  store.update(job.id, { status: 'RUNNING' });

  try {
    return await withSpan('hjb.gateway.mdp', async () => {
      const grid = createGrid(config.grid);
      const dynamics = createDynamics(config.dynamics);
      const cost = createCost(config.cost);
      const states = buildLatticeStates(grid);
      const actions = enumerateControls(dynamics, config.controlResolution);

      const result = valueIteration({
        states,
        actions,
        transition: (stateIndex, actionIndex) => {
          const state = states[stateIndex];
          const control = actions[actionIndex];
          const derivative = dynamics.evaluate(state, control);
          const next = state.map((value, idx) => value + derivative[idx] * config.dt);
          const index = nearestState(states, next);
          return [[index, 1]];
        },
        reward: (stateIndex, actionIndex) => {
          const state = states[stateIndex];
          const control = actions[actionIndex];
          return cost.stage(state, control) * config.dt;
        },
        discount: config.discount,
        tolerance: 1e-6,
        maxIterations: 2000
      });

      const greedy = extractGreedyPolicy({
        states,
        actions,
        transition: (stateIndex, actionIndex) => {
          const state = states[stateIndex];
          const control = actions[actionIndex];
          const derivative = dynamics.evaluate(state, control);
          const next = state.map((value, idx) => value + derivative[idx] * config.dt);
          const index = nearestState(states, next);
          return [[index, 1]];
        },
        reward: (stateIndex, actionIndex) => {
          const state = states[stateIndex];
          const control = actions[actionIndex];
          return cost.stage(state, control) * config.dt;
        },
        discount: config.discount
      }, result.value);

      const artifactDir = join(tmpdir(), job.id);
      exportArtifacts({
        value: Float64Array.from(result.value),
        policy: greedy.actions,
        grid,
        quiverPath: join(artifactDir, 'quiver.png'),
        valuePath: join(artifactDir, 'V.csv'),
        policyPath: join(artifactDir, 'policy.csv'),
        rolloutPath: join(artifactDir, 'rollout.webm'),
        rollout: undefined
      });

      store.update(job.id, {
        status: 'COMPLETED',
        metrics: { residual: result.residual, iterations: result.iterations, ties: greedy.ties },
        artifacts: [
          { name: 'V.csv', path: join(artifactDir, 'V.csv') },
          { name: 'policy.csv', path: join(artifactDir, 'policy.csv') },
          { name: 'quiver.png', path: join(artifactDir, 'quiver.png') }
        ]
      });
      store.attachData(job.id, <MdpJobData>{ kind: 'MDP', states, actions, dynamics, cost, grid, dt: config.dt, policy: greedy.actions });
      return store.get(job.id)!;
    });
  } catch (error) {
    store.update(job.id, { status: 'FAILED', error: (error as Error).message });
    throw error;
  }
}
