import { trace } from '@opentelemetry/api';
import type { RolloutConfig, RolloutResult, RolloutSample, Vector } from '../types.js';

function applyClamp(state: Vector, clamp?: (state: Vector) => Vector): Vector {
  if (!clamp) {
    return state;
  }
  return clamp(state);
}

export function simulateRollout(config: RolloutConfig): RolloutResult {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.rollout.sim');
  const samples: RolloutSample[] = [];
  let state = config.start.slice();
  let time = 0;
  let totalCost = 0;

  for (let step = 0; step < config.steps; step += 1) {
    const control = config.policy(state.slice());
    const derivative = config.dynamics.evaluate(state, control);
    const nextState = state.map((value, index) => value + derivative[index] * config.dt);
    const clamped = applyClamp(nextState, config.clamp);
    const stageCost = config.cost?.stage?.(state, control);
    if (stageCost !== undefined) {
      totalCost += stageCost * config.dt;
    }
    samples.push({ time, state: state.slice(), control: control.slice(), stageCost });
    state = clamped;
    time += config.dt;
  }

  span.setAttribute('steps', config.steps);
  span.setAttribute('dt', config.dt);
  span.setAttribute('totalCost', totalCost);
  span.end();

  return { samples, totalCost };
}
