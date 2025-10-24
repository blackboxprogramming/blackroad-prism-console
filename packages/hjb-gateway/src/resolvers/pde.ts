import { join } from 'path';
import { tmpdir } from 'os';
import { createGrid, solveStationary, solveTimeDependent, createSingleIntegrator, createDoubleIntegrator, createDubinsCar, createQuadraticCost, withObstacleCost, buildHamiltonian, computeGodunovGradient, iterateGrid, exportArtifacts } from '@blackroad/hjb-engine';
import type { Grid, DynamicsContext, CostContext, StationarySolverResult, TimeDependentSolverResult, Vector } from '@blackroad/hjb-engine';
import { withSpan } from '../otel.js';
import type { GatewayContext, HjbJobStore, HjbJob } from './types.js';
import { assertCanMutate } from '../auth/rbac.js';

interface PdeJobData {
  kind: 'PDE';
  grid: Grid;
  dynamics: DynamicsContext;
  cost: CostContext;
  policy: Vector[];
  value: Float64Array;
}

interface PdeConfig {
  grid: { shape: number[]; spacing: number[]; origin: number[] };
  dynamics: { type: string; options?: Record<string, unknown> };
  cost: Record<string, unknown>;
  horizon?: number;
  tolerance?: number;
  damping?: number;
  timeStep?: number;
  boundary?: 'clamp' | 'wrap';
}

function createDynamics(config: PdeConfig['dynamics']): DynamicsContext {
  const options = config.options ?? {};
  switch (config.type) {
    case 'single_integrator':
      return createSingleIntegrator({ dimension: (options.dimension as number) ?? 2, controlLimit: (options.controlLimit as number) ?? 3, controlResolution: (options.controlResolution as number) ?? 0.5 });
    case 'double_integrator':
      return createDoubleIntegrator({ positionDimension: (options.dimension as number) ?? 2, controlLimit: (options.controlLimit as number) ?? 3, damping: (options.damping as number) ?? 0.2, controlResolution: (options.controlResolution as number) ?? 0.5 });
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
    return withObstacleCost({
      base,
      obstacles: (config.obstacles as Array<{ center: number[]; radius: number; weight: number }>) ?? []
    });
  }
  throw new Error(`Unsupported cost type ${type}`);
}

function computePolicy(grid: Grid, dynamics: DynamicsContext, cost: CostContext, value: Float64Array, boundary: 'clamp' | 'wrap' = 'clamp'): Vector[] {
  const hamiltonian = buildHamiltonian({ dynamics, cost });
  const policy: Vector[] = new Array(grid.size).fill(0).map(() => new Array(dynamics.controlDim).fill(0));
  iterateGrid(grid, (index, coords, position) => {
    const gradient = computeGodunovGradient(grid, value, coords, boundary);
    const result = hamiltonian(position, gradient.gradient);
    policy[index] = result.control.slice();
  });
  return policy;
}

export async function runPdeJob(store: HjbJobStore, rawConfig: unknown, context: GatewayContext): Promise<HjbJob> {
  assertCanMutate(context);
  const config = rawConfig as PdeConfig;
  const job = store.create('PDE', rawConfig);
  store.update(job.id, { status: 'RUNNING' });

  try {
    return await withSpan('hjb.gateway.pde', async () => {
      const grid = createGrid(config.grid);
      const dynamics = createDynamics(config.dynamics);
      const cost = createCost(config.cost);
      let result: StationarySolverResult | TimeDependentSolverResult;
      if (config.horizon && config.horizon > 0) {
        result = solveTimeDependent({ grid, dynamics, cost, horizon: config.horizon, tolerance: config.tolerance, timeStep: config.timeStep, boundary: config.boundary });
      } else {
        result = solveStationary({ grid, dynamics, cost, tolerance: config.tolerance, damping: config.damping, boundary: config.boundary });
      }
      const policy = computePolicy(grid, dynamics, cost, result.value, config.boundary);
      const artifactDir = join(tmpdir(), job.id);
      exportArtifacts({
        value: result.value,
        policy,
        grid,
        quiverPath: join(artifactDir, 'quiver.png'),
        valuePath: join(artifactDir, 'V.csv'),
        policyPath: join(artifactDir, 'policy.csv'),
        rolloutPath: join(artifactDir, 'rollout.webm'),
        rollout: undefined
      });

      store.update(job.id, {
        status: 'COMPLETED',
        metrics: { residual: result.residual, iterations: result.iterations },
        artifacts: [
          { name: 'V.csv', path: join(artifactDir, 'V.csv') },
          { name: 'policy.csv', path: join(artifactDir, 'policy.csv') },
          { name: 'quiver.png', path: join(artifactDir, 'quiver.png') }
        ]
      });
      store.attachData(job.id, <PdeJobData>{ kind: 'PDE', grid, dynamics, cost, policy, value: result.value });
      return store.get(job.id)!;
    });
  } catch (error) {
    store.update(job.id, { status: 'FAILED', error: (error as Error).message });
    throw error;
  }
}
