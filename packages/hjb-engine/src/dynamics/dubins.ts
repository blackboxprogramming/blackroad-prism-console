import type { DynamicsContext, Vector } from '../types.js';

export interface DubinsOptions {
  speed?: number;
  turnRate?: number;
  controlResolution?: number;
}

export function createDubinsCar(options: DubinsOptions = {}): DynamicsContext {
  const speed = options.speed ?? 1;
  const turnRate = options.turnRate ?? 1;
  const resolution = options.controlResolution ?? 0.25;

  return {
    stateDim: 3,
    controlDim: 1,
    controlBounds: [[-turnRate, turnRate]],
    controlResolution: resolution,
    evaluate(state: Vector, control: Vector): Vector {
      if (state.length !== 3) {
        throw new Error('Dubins state must be [x, y, heading]');
      }
      const heading = state[2];
      const omega = Math.max(-turnRate, Math.min(turnRate, control[0] ?? 0));
      return [speed * Math.cos(heading), speed * Math.sin(heading), omega];
    },
    maxSpeed() {
      return Math.max(speed, turnRate);
    },
    characteristicSpeeds(state: Vector, control: Vector): Vector {
      return this.evaluate(state, control);
    }
  };
}
