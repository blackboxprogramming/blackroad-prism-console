import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import type { CostContext, DynamicsContext, HamiltonianResult, Vector } from '../types.js';

export interface HamiltonianOptions {
  dynamics: DynamicsContext;
  cost: CostContext;
  controlSamplesPerDim?: number;
}

function enumerateControls(dynamics: DynamicsContext, samplesPerDim: number): Vector[] {
  const values: Vector[] = [];
  const dimension = dynamics.controlDim;
  const control = new Array(dimension).fill(0);
  const recurse = (dim: number) => {
    if (dim === dimension) {
      values.push(control.slice());
      return;
    }
    const [min, max] = dynamics.controlBounds[dim];
    const steps = Math.max(1, samplesPerDim);
    if (steps === 1) {
      const mid = Math.max(min, Math.min(max, 0));
      control[dim] = mid;
      recurse(dim + 1);
      return;
    }
    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      control[dim] = min + (max - min) * ratio;
      recurse(dim + 1);
    }
  };
  recurse(0);
  return values;
}

export function buildHamiltonian(options: HamiltonianOptions) {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.hamiltonian.prepare');
  const controlSamplesPerDim = options.controlSamplesPerDim ?? Math.max(3, Math.ceil((options.dynamics.controlBounds[0][1] - options.dynamics.controlBounds[0][0]) / Math.max(0.25, options.dynamics.controlResolution ?? 0.25)));
  const controls = enumerateControls(options.dynamics, controlSamplesPerDim);
  span.setAttribute('control.grid', controls.length);
  span.end();

  return function evaluate(state: Vector, gradient: Vector): HamiltonianResult {
    if (gradient.length !== options.dynamics.stateDim) {
      throw new Error('Gradient dimensionality mismatch');
    }
    return context.with(trace.setSpan(context.active(), tracer.startSpan('hjb.hamiltonian.eval')), () => {
      const evalSpan = trace.getSpan(context.active());
      try {
        let best: HamiltonianResult | undefined;
        for (const control of controls) {
          const dynamics = options.dynamics.evaluate(state, control);
          const cost = options.cost.stage(state, control);
          let dot = 0;
          for (let i = 0; i < gradient.length; i += 1) {
            dot += gradient[i] * dynamics[i];
          }
          const value = cost + dot;
          if (!best || value < best.value) {
            best = { value, control: control.slice(), dynamics };
          }
        }
        if (!best) {
          throw new Error('Failed to evaluate Hamiltonian');
        }
        evalSpan?.setAttribute('hamiltonian.value', best.value);
        evalSpan?.setStatus({ code: SpanStatusCode.OK });
        return best;
      } catch (error) {
        evalSpan?.recordException(error as Error);
        evalSpan?.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        evalSpan?.end();
      }
    });
  };
}
