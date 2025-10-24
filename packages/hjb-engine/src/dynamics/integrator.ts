import type { DynamicsContext, Vector } from '../types.js';

export interface SingleIntegratorOptions {
  dimension: number;
  controlLimit?: number;
  controlResolution?: number;
}

export function createSingleIntegrator(options: SingleIntegratorOptions): DynamicsContext {
  const controlLimit = options.controlLimit ?? 2;
  const controlBounds: Array<[number, number]> = new Array(options.dimension).fill(0).map(() => [-controlLimit, controlLimit]);
  const resolution = options.controlResolution ?? 0.25;

  return {
    stateDim: options.dimension,
    controlDim: options.dimension,
    controlBounds,
    controlResolution: resolution,
    evaluate(state: Vector, control: Vector): Vector {
      void state;
      if (control.length !== options.dimension) {
        throw new Error('Control dimension mismatch for single integrator');
      }
      return control.slice();
    },
    maxSpeed() {
      return controlLimit;
    },
    characteristicSpeeds(_state: Vector, control: Vector): Vector {
      return control.slice();
    }
  };
}
