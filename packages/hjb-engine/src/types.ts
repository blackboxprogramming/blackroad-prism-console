export type Vector = number[];

export interface GridSpec {
  shape: number[];
  spacing: number[];
  origin: number[];
}

export interface Grid {
  spec: GridSpec;
  size: number;
  strides: number[];
}

export interface DynamicsContext {
  stateDim: number;
  controlDim: number;
  controlBounds: Array<[number, number]>;
  controlResolution?: number;
  evaluate(state: Vector, control: Vector): Vector;
  maxSpeed(state?: Vector): number;
  characteristicSpeeds?(state: Vector, control: Vector): Vector;
}

export interface CostContext {
  stage(state: Vector, control: Vector): number;
  terminal?(state: Vector): number;
}

export interface HamiltonianResult {
  value: number;
  control: Vector;
  dynamics: Vector;
}

export interface GodunovGradient {
  gradient: Vector;
  forward: Vector;
  backward: Vector;
}

export interface StationarySolverConfig {
  grid: Grid;
  dynamics: DynamicsContext;
  cost: CostContext;
  boundary?: 'clamp' | 'wrap';
  tolerance?: number;
  maxIterations?: number;
  damping?: number;
}

export interface TimeDependentSolverConfig extends StationarySolverConfig {
  horizon: number;
  timeStep?: number;
  initial?: Float64Array;
}

export interface StationarySolverResult {
  value: Float64Array;
  iterations: number;
  residual: number;
}

export interface TimeDependentSolverResult {
  value: Float64Array;
  iterations: number;
  residual: number;
  timeStep: number;
}

export interface ValueIterationConfig {
  states: Vector[];
  actions: Vector[];
  transition: (stateIndex: number, actionIndex: number) => Array<[number, number]>;
  reward: (stateIndex: number, actionIndex: number) => number;
  discount: number;
  tolerance?: number;
  maxIterations?: number;
  initial?: number[];
}

export interface ValueIterationResult {
  value: number[];
  iterations: number;
  residual: number;
}

export type Policy = (state: Vector) => Vector;

export interface RolloutConfig {
  dynamics: DynamicsContext;
  policy: Policy;
  start: Vector;
  dt: number;
  steps: number;
  clamp?: (state: Vector) => Vector;
  cost?: CostContext;
}

export interface RolloutSample {
  time: number;
  state: Vector;
  control: Vector;
  stageCost?: number;
}

export interface RolloutResult {
  samples: RolloutSample[];
  totalCost?: number;
}

export interface ArtifactSpec {
  value: Float64Array;
  policy: Vector[];
  grid: Grid;
  quiverPath: string;
  valuePath: string;
  policyPath: string;
  rolloutPath: string;
  rollout?: RolloutResult;
}
