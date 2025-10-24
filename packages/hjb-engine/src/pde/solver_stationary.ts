import { trace } from '@opentelemetry/api';
import { createValueArray, iterateGrid, positionFromCoords, indexFromCoords } from '../common/grid.js';
import { computeCflTimeStep } from './godunov_upwind.js';
import type { StationarySolverConfig, StationarySolverResult } from '../types.js';

export function solveStationary(config: StationarySolverConfig): StationarySolverResult {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.pde.stationary');
  const tolerance = config.tolerance ?? 1e-3;
  const maxIterations = config.maxIterations ?? 2500;
  const damping = config.damping ?? 0.3;
  const grid = config.grid;
  const values = createValueArray(grid, 0);
  const scratch = createValueArray(grid, 0);
  const dtBase = computeCflTimeStep(grid, config.dynamics, 0.8);
  const dt = Number.isFinite(dtBase) && dtBase > 0 ? dtBase : 0.1;
  const controls = enumerateControls(config.dynamics);

  iterateGrid(grid, (index, _coords, position) => {
    const zero = new Array(config.dynamics.controlDim).fill(0);
    values[index] = config.cost.terminal?.(position) ?? config.cost.stage(position, zero);
  });

  let iteration = 0;
  let residual = Number.POSITIVE_INFINITY;

  while (iteration < maxIterations && residual > tolerance) {
    residual = 0;
    iterateGrid(grid, (index, _coords, position) => {
      let best = values[index];
      for (const control of controls) {
        const derivative = config.dynamics.evaluate(position, control);
        const next = position.map((value, dim) => value + derivative[dim] * dt);
        const continuation = sampleValue(next, grid, values);
        const stage = config.cost.stage(position, control) * dt + continuation;
        if (stage < best) {
          best = stage;
        }
      }
      const blended = (1 - damping) * values[index] + damping * best;
      const clamped = Math.max(0, Math.min(1e6, blended));
      scratch[index] = clamped;
      const diff = Math.abs(clamped - values[index]);
      if (diff > residual) {
        residual = diff;
      }
    });

    values.set(scratch);
    iteration += 1;
    span.addEvent('hjb.pde.step', { iteration, residual });
  }

  span.setAttribute('iterations', iteration);
  span.setAttribute('residual', residual);
  span.end();

  return { value: values, iterations: iteration, residual };
}

function enumerateControls(dynamics: StationarySolverConfig['dynamics']) {
  const values: number[][] = [];
  const control = new Array(dynamics.controlDim).fill(0);
  const samplesPerDim = Math.max(
    1,
    Math.ceil((dynamics.controlBounds[0][1] - dynamics.controlBounds[0][0]) / Math.max(0.25, dynamics.controlResolution ?? 0.25))
  );
  const recurse = (dim: number) => {
    if (dim === dynamics.controlDim) {
      values.push(control.slice());
      return;
    }
    const [min, max] = dynamics.controlBounds[dim];
    if (samplesPerDim === 1) {
      control[dim] = Math.max(min, Math.min(max, 0));
      recurse(dim + 1);
      return;
    }
    for (let i = 0; i <= samplesPerDim; i += 1) {
      const ratio = i / samplesPerDim;
      control[dim] = min + (max - min) * ratio;
      recurse(dim + 1);
    }
  };
  recurse(0);
  return values;
}

function sampleValue(position: number[], grid: StationarySolverConfig['grid'], values: Float64Array): number {
  const dims = grid.spec.shape.length;
  const recurse = (dim: number, weight: number, coords: number[]): number => {
    if (dim === dims) {
      const index = indexFromCoords(grid, coords);
      return weight * values[index];
    }
    const relative = (position[dim] - grid.spec.origin[dim]) / grid.spec.spacing[dim];
    const clampedLower = Math.max(0, Math.min(grid.spec.shape[dim] - 1, Math.floor(relative)));
    const clampedUpper = Math.max(0, Math.min(grid.spec.shape[dim] - 1, clampedLower + 1));
    const fraction = Math.max(0, Math.min(1, relative - Math.floor(relative)));
    return (
      recurse(dim + 1, weight * (1 - fraction), [...coords, clampedLower]) +
      recurse(dim + 1, weight * fraction, [...coords, clampedUpper])
    );
  };
  return recurse(0, 1, []);
}
