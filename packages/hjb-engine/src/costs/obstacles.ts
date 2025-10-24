import type { CostContext, Vector } from '../types.js';

export interface ObstacleDefinition {
  center: Vector;
  radius: number;
  weight: number;
}

export interface ObstacleCostOptions {
  base: CostContext;
  obstacles: ObstacleDefinition[];
  softness?: number;
}

export function withObstacleCost(options: ObstacleCostOptions): CostContext {
  const softness = options.softness ?? 0.5;
  return {
    stage(state: Vector, control: Vector): number {
      let cost = options.base.stage(state, control);
      for (const obstacle of options.obstacles) {
        const distance = Math.sqrt(state.reduce((sum, value, index) => {
          const diff = value - (obstacle.center[index] ?? 0);
          return sum + diff * diff;
        }, 0));
        if (distance < obstacle.radius) {
          const penalty = obstacle.weight * Math.exp(-(distance * distance) / Math.max(softness, 1e-6));
          cost += penalty;
        }
      }
      return cost;
    },
    terminal(state: Vector) {
      let cost = options.base.terminal?.(state) ?? 0;
      for (const obstacle of options.obstacles) {
        const distance = Math.sqrt(state.reduce((sum, value, index) => {
          const diff = value - (obstacle.center[index] ?? 0);
          return sum + diff * diff;
        }, 0));
        if (distance < obstacle.radius) {
          const penalty = obstacle.weight * Math.exp(-(distance * distance) / Math.max(softness, 1e-6));
          cost += penalty;
        }
      }
      return cost;
    }
  };
}
