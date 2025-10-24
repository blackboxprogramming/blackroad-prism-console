import { trace } from '@opentelemetry/api';
import { neighborIndex } from '../common/grid.js';
import type { DynamicsContext, GodunovGradient, Grid, Vector } from '../types.js';

export function computeGodunovGradient(
  grid: Grid,
  values: Float64Array,
  coords: number[],
  boundary: 'clamp' | 'wrap' = 'clamp'
): GodunovGradient {
  const backward: number[] = new Array(grid.spec.shape.length).fill(0);
  const forward: number[] = new Array(grid.spec.shape.length).fill(0);
  const gradient: number[] = new Array(grid.spec.shape.length).fill(0);
  const index = coords.reduce((acc, value, dim) => acc + value * grid.strides[dim], 0);
  const center = values[index];

  for (let dim = 0; dim < grid.spec.shape.length; dim += 1) {
    const dx = grid.spec.spacing[dim];
    const minusIndex = neighborIndex(grid, coords, dim, -1, boundary);
    const plusIndex = neighborIndex(grid, coords, dim, 1, boundary);
    const backwardDiff = (center - values[minusIndex]) / dx;
    const forwardDiff = (values[plusIndex] - center) / dx;
    backward[dim] = backwardDiff;
    forward[dim] = forwardDiff;

    if (backwardDiff >= 0 && forwardDiff >= 0) {
      gradient[dim] = Math.min(backwardDiff, forwardDiff);
    } else if (backwardDiff <= 0 && forwardDiff <= 0) {
      gradient[dim] = Math.max(backwardDiff, forwardDiff);
    } else {
      gradient[dim] = 0;
    }
  }

  return { backward, forward, gradient };
}

export function computeCflTimeStep(grid: Grid, dynamics: DynamicsContext, cfl: number): number {
  const tracer = trace.getTracer('hjb-engine');
  const span = tracer.startSpan('hjb.cfl');
  try {
    const maxSpeed = dynamics.maxSpeed();
    if (maxSpeed <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    const minSpacing = Math.min(...grid.spec.spacing);
    const dt = (cfl * minSpacing) / maxSpeed;
    span.setAttribute('cfl.dt', dt);
    return dt;
  } finally {
    span.end();
  }
}

export function applyGodunovFlux(
  grid: Grid,
  values: Float64Array,
  coords: number[],
  direction: Vector,
  boundary: 'clamp' | 'wrap' = 'clamp'
): Vector {
  const { backward, forward } = computeGodunovGradient(grid, values, coords, boundary);
  const flux: number[] = new Array(grid.spec.shape.length).fill(0);
  for (let dim = 0; dim < flux.length; dim += 1) {
    flux[dim] = direction[dim] >= 0 ? backward[dim] : forward[dim];
  }
  return flux;
}
