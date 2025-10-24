import { trace } from '@opentelemetry/api';
import type { ValueIterationConfig, ValueIterationResult } from '../types.js';

export function valueIteration(config: ValueIterationConfig): ValueIterationResult {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.mdp.value_iteration');
  const tolerance = config.tolerance ?? 1e-6;
  const maxIterations = config.maxIterations ?? 10_000;
  const value = config.initial ? config.initial.slice() : new Array(config.states.length).fill(0);

  let residual = Number.POSITIVE_INFINITY;
  let iteration = 0;

  while (iteration < maxIterations && residual > tolerance) {
    residual = 0;
    for (let s = 0; s < config.states.length; s += 1) {
      let best = Number.POSITIVE_INFINITY;
      for (let a = 0; a < config.actions.length; a += 1) {
        const transitions = config.transition(s, a);
        let total = config.reward(s, a);
        for (const [next, probability] of transitions) {
          total += config.discount * probability * value[next];
        }
        if (total < best) {
          best = total;
        }
      }
      const diff = Math.abs(best - value[s]);
      if (diff > residual) {
        residual = diff;
      }
      value[s] = best;
    }
    iteration += 1;
    const iterSpan = tracer.startSpan('hjb.mdp.iter');
    iterSpan.setAttribute('iteration', iteration);
    iterSpan.setAttribute('residual', residual);
    iterSpan.end();
  }

  span.setAttribute('iterations', iteration);
  span.setAttribute('residual', residual);
  span.end();

  return { value, iterations: iteration, residual };
}
