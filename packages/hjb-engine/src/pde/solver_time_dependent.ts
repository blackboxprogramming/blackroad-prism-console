import { trace } from '@opentelemetry/api';
import { createValueArray, iterateGrid } from '../common/grid.js';
import { buildHamiltonian } from './hamiltonian.js';
import { computeGodunovGradient, computeCflTimeStep } from './godunov_upwind.js';
import type { TimeDependentSolverConfig, TimeDependentSolverResult } from '../types.js';

export function solveTimeDependent(config: TimeDependentSolverConfig): TimeDependentSolverResult {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.pde.time');
  const tolerance = config.tolerance ?? 1e-3;
  const boundary = config.boundary ?? 'clamp';
  const grid = config.grid;
  const initial = config.initial ? new Float64Array(config.initial) : createValueArray(grid, 0);
  const values = initial;
  const scratch = createValueArray(grid, 0);
  const hamiltonian = buildHamiltonian({ dynamics: config.dynamics, cost: config.cost });
  const dt = config.timeStep ?? computeCflTimeStep(grid, config.dynamics, 0.8);
  const steps = Math.max(1, Math.ceil(config.horizon / dt));

  let residual = Number.POSITIVE_INFINITY;
  let iteration = 0;

  for (let step = 0; step < steps; step += 1) {
    residual = 0;
    iterateGrid(grid, (index, coords, position) => {
      const gradient = computeGodunovGradient(grid, values, coords, boundary);
      const ham = hamiltonian(position, gradient.gradient);
      const updated = values[index] - dt * ham.value;
      scratch[index] = updated;
      const diff = Math.abs(updated - values[index]);
      if (diff > residual) {
        residual = diff;
      }
    });
    values.set(scratch);
    iteration = step + 1;
    span.addEvent('hjb.pde.step', { iteration, residual, dt });
    if (residual < tolerance) {
      break;
    }
  }

  span.setAttribute('iterations', iteration);
  span.setAttribute('residual', residual);
  span.setAttribute('dt', dt);
  span.end();

  return { value: values, iterations: iteration, residual, timeStep: dt };
}
