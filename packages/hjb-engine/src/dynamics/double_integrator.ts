import type { DynamicsContext, Vector } from '../types.js';

export interface DoubleIntegratorOptions {
  positionDimension: number;
  controlLimit?: number;
  damping?: number;
  controlResolution?: number;
}

export function createDoubleIntegrator(options: DoubleIntegratorOptions): DynamicsContext {
  const controlLimit = options.controlLimit ?? 2;
  const damping = options.damping ?? 0;
  const dimension = options.positionDimension;
  const controlBounds: Array<[number, number]> = new Array(dimension).fill(0).map(() => [-controlLimit, controlLimit]);
  const resolution = options.controlResolution ?? 0.5;

  return {
    stateDim: dimension * 2,
    controlDim: dimension,
    controlBounds,
    controlResolution: resolution,
    evaluate(state: Vector, control: Vector): Vector {
      if (state.length !== dimension * 2) {
        throw new Error('State dimension mismatch for double integrator');
      }
      if (control.length !== dimension) {
        throw new Error('Control dimension mismatch for double integrator');
      }
      const derivative = new Array(dimension * 2).fill(0);
      for (let i = 0; i < dimension; i += 1) {
        derivative[i] = state[dimension + i];
        derivative[dimension + i] = control[i] - damping * state[dimension + i];
      }
      return derivative;
    },
    maxSpeed() {
      return controlLimit + Math.max(1, damping);
    },
    characteristicSpeeds(state: Vector, control: Vector): Vector {
      const derivative = this.evaluate(state, control);
      return derivative;
    }
  };
}
