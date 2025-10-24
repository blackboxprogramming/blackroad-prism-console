import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createGrid,
  solveStationary,
  solveTimeDependent,
  buildHamiltonian,
  computeGodunovGradient,
  iterateGrid,
  createSingleIntegrator,
  createDoubleIntegrator,
  createDubinsCar,
  createQuadraticCost,
  withObstacleCost,
  valueIteration,
  extractGreedyPolicy,
  simulateRollout
} from '@blackroad/hjb-engine';
import type { Grid, DynamicsContext, CostContext, StationarySolverResult, TimeDependentSolverResult, Vector } from '@blackroad/hjb-engine';

export interface HjbSolveConfig {
  mode: 'pde' | 'mdp';
  outputDir?: string;
  pde?: PdeConfig;
  mdp?: MdpConfig;
  rollout?: RolloutConfig;
}

export interface PdeConfig {
  grid: { shape: number[]; spacing: number[]; origin: number[] };
  dynamics: { type: string; options?: Record<string, unknown> };
  cost: Record<string, unknown>;
  tolerance?: number;
  damping?: number;
  horizon?: number;
  timeStep?: number;
  boundary?: 'clamp' | 'wrap';
}

export interface MdpConfig {
  grid: { shape: number[]; spacing: number[]; origin: number[] };
  dynamics: { type: string; options?: Record<string, unknown> };
  cost: Record<string, unknown>;
  discount: number;
  dt: number;
  controlResolution?: number;
}

export interface RolloutConfig {
  start: number[];
  steps?: number;
  dt?: number;
  out?: string;
}

export function loadSolveConfig(configPath: string): HjbSolveConfig {
  const file = resolve(configPath);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as HjbSolveConfig;
  if (parsed.mode !== 'pde' && parsed.mode !== 'mdp') {
    throw new Error('Config must specify mode "pde" or "mdp"');
  }
  return parsed;
}

export function createDynamics(definition: { type: string; options?: Record<string, unknown> }): DynamicsContext {
  const options = definition.options ?? {};
  switch (definition.type) {
    case 'single_integrator':
      return createSingleIntegrator({
        dimension: (options.dimension as number) ?? 2,
        controlLimit: (options.controlLimit as number) ?? 3,
        controlResolution: (options.controlResolution as number) ?? 0.5
      });
    case 'double_integrator':
      return createDoubleIntegrator({
        positionDimension: (options.dimension as number) ?? 1,
        controlLimit: (options.controlLimit as number) ?? 2,
        damping: (options.damping as number) ?? 0.2,
        controlResolution: (options.controlResolution as number) ?? 0.5
      });
    case 'dubins':
      return createDubinsCar({
        speed: (options.speed as number) ?? 1,
        turnRate: (options.turnRate as number) ?? 1,
        controlResolution: (options.controlResolution as number) ?? 0.25
      });
    default:
      throw new Error(`Unsupported dynamics type ${definition.type}`);
  }
}

export function createCost(definition: Record<string, unknown>): CostContext {
  const type = definition.type as string;
  if (type === 'quadratic') {
    return createQuadraticCost({
      stateWeights: (definition.stateWeights as number[]) ?? [1, 1],
      controlWeights: (definition.controlWeights as number[]) ?? [1, 1],
      goal: (definition.goal as number[]) ?? undefined
    });
  }
  if (type === 'quadratic_with_obstacles') {
    const base = createQuadraticCost({
      stateWeights: (definition.stateWeights as number[]) ?? [1, 1],
      controlWeights: (definition.controlWeights as number[]) ?? [1, 1],
      goal: (definition.goal as number[]) ?? undefined
    });
    return withObstacleCost({ base, obstacles: (definition.obstacles as Array<{ center: number[]; radius: number; weight: number }>) ?? [] });
  }
  throw new Error(`Unsupported cost type ${type}`);
}

export function computePdeSolution(config: PdeConfig) {
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
  return { grid, dynamics, cost, result, policy };
}

export function computePolicy(grid: Grid, dynamics: DynamicsContext, cost: CostContext, value: Float64Array, boundary: 'clamp' | 'wrap' = 'clamp'): Vector[] {
  const hamiltonian = buildHamiltonian({ dynamics, cost });
  const policy: Vector[] = new Array(grid.size).fill(0).map(() => new Array(dynamics.controlDim).fill(0));
  iterateGrid(grid, (index, coords, position) => {
    const gradient = computeGodunovGradient(grid, value, coords, boundary);
    const result = hamiltonian(position, gradient.gradient);
    policy[index] = result.control.slice();
  });
  return policy;
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

export function computeMdpSolution(config: MdpConfig) {
  const grid = createGrid(config.grid);
  const dynamics = createDynamics(config.dynamics);
  const cost = createCost(config.cost);
  const states: Vector[] = new Array(grid.size).fill(0).map(() => []);
  iterateGrid(grid, (index, coords, position) => {
    states[index] = position.slice();
  });
  const actions = enumerateControls(dynamics, config.controlResolution);

  const transition = (stateIndex: number, actionIndex: number) => {
    const state = states[stateIndex];
    const control = actions[actionIndex];
    const derivative = dynamics.evaluate(state, control);
    const next = state.map((value, idx) => value + derivative[idx] * config.dt);
    const index = nearestState(states, next);
    return [[index, 1]] as Array<[number, number]>;
  };

  const reward = (stateIndex: number, actionIndex: number) => {
    const state = states[stateIndex];
    const control = actions[actionIndex];
    return cost.stage(state, control) * config.dt;
  };

  const result = valueIteration({
    states,
    actions,
    transition,
    reward,
    discount: config.discount,
    tolerance: 1e-6,
    maxIterations: 2000
  });

  const greedy = extractGreedyPolicy({ states, actions, transition, reward, discount: config.discount }, result.value);
  return { grid, dynamics, cost, states, actions, result, greedy };
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

export function runRolloutSimulation(
  dynamics: DynamicsContext,
  cost: CostContext | undefined,
  stateLookup: (state: Vector) => Vector,
  start: Vector,
  steps: number,
  dt: number
) {
  return simulateRollout({ dynamics, cost, policy: stateLookup, start, steps, dt });
}

export function nearestFromGrid(grid: Grid, state: Vector): number {
  const { shape, spacing, origin } = grid.spec;
  let index = 0;
  for (let dim = 0; dim < shape.length; dim += 1) {
    const coord = Math.round((state[dim] - origin[dim]) / spacing[dim]);
    const clamped = Math.max(0, Math.min(shape[dim] - 1, coord));
    index = index * shape[dim] + clamped;
  }
  return index;
}

export function nearestFromStates(states: Vector[], state: Vector): number {
  return nearestState(states, state);
}
