import type { CostContext, Vector } from '../types.js';

export interface QuadraticCostOptions {
  stateWeights: number[];
  controlWeights: number[];
  goal?: Vector;
}

export function createQuadraticCost(options: QuadraticCostOptions): CostContext {
  const goal = options.goal ?? new Array(options.stateWeights.length).fill(0);
  return {
    stage(state: Vector, control: Vector): number {
      let stateCost = 0;
      for (let i = 0; i < options.stateWeights.length; i += 1) {
        const error = state[i] - (goal[i] ?? 0);
        stateCost += options.stateWeights[i] * error * error;
      }
      let controlCost = 0;
      for (let i = 0; i < options.controlWeights.length; i += 1) {
        const value = control[i] ?? 0;
        controlCost += options.controlWeights[i] * value * value;
      }
      return 0.5 * (stateCost + controlCost);
    },
    terminal(state: Vector) {
      let cost = 0;
      for (let i = 0; i < options.stateWeights.length; i += 1) {
        const error = state[i] - (goal[i] ?? 0);
        cost += options.stateWeights[i] * error * error * 0.5;
      }
      return cost;
    }
  };
}
