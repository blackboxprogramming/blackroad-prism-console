import { context, trace } from '@opentelemetry/api';
import { logSumExpColumn, logSumExpRow } from '../ops/logsumexp.js';
import { Diagnostics, SinkhornConfig, SinkhornIterate, SinkhornResult, Vector } from '../types.js';
import { computeDiagnostics } from './diagnostics.js';

function safeLog(value: number): number {
  return Math.log(Math.max(value, Number.EPSILON));
}

function computeLogKernel(cost: Float64Array, epsilon: number): Float64Array {
  const logKernel = new Float64Array(cost.length);
  for (let i = 0; i < cost.length; i += 1) {
    logKernel[i] = -cost[i] / epsilon;
  }
  return logKernel;
}

function computeCoupling(logKernel: Float64Array, logU: Float64Array, logV: Float64Array, rows: number, cols: number): Float64Array {
  const coupling = new Float64Array(rows * cols);
  for (let i = 0; i < rows; i += 1) {
    const base = i * cols;
    for (let j = 0; j < cols; j += 1) {
      const value = logKernel[base + j] + logU[i] + logV[j];
      coupling[base + j] = Math.exp(Math.max(-700, Math.min(700, value)));
    }
  }
  return coupling;
}

function computeMarginals(
  logKernel: Float64Array,
  logU: Float64Array,
  logV: Float64Array,
  rows: number,
  cols: number
) {
  const left = new Float64Array(rows);
  const right = new Float64Array(cols);

  for (let i = 0; i < rows; i += 1) {
    let acc = 0;
    const base = i * cols;
    for (let j = 0; j < cols; j += 1) {
      const value = logKernel[base + j] + logU[i] + logV[j];
      acc += Math.exp(Math.max(-700, Math.min(700, value)));
    }
    left[i] = acc;
  }

  for (let j = 0; j < cols; j += 1) {
    let acc = 0;
    for (let i = 0; i < rows; i += 1) {
      const value = logKernel[i * cols + j] + logU[i] + logV[j];
      acc += Math.exp(Math.max(-700, Math.min(700, value)));
    }
    right[j] = acc;
  }

  return { left, right };
}

function l1NormDiff(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

export interface SinkhornOutputs extends SinkhornResult {
  diagnostics: Diagnostics;
}

export function logSinkhorn(
  mu: Vector,
  nu: Vector,
  cost: Float64Array,
  rows: number,
  cols: number,
  config: SinkhornConfig
): SinkhornOutputs {
  if (mu.length !== rows || nu.length !== cols) {
    throw new Error('Distribution and cost matrix dimensions mismatch');
  }
  if (config.epsilon <= 0) {
    throw new Error('epsilon must be positive');
  }

  const tracer = trace.getTracer('sb-engine');
  return context.with(trace.setSpan(context.active(), tracer.startSpan('sb.sinkhorn')), () => {
    try {
      const maxIterations = config.maxIterations ?? 500;
      const tolerance = config.tolerance ?? 1e-3;
      const clamp = config.clamp ?? 80;
      const checkInterval = Math.max(1, config.checkInterval ?? 10);
      const logKernel = computeLogKernel(cost, config.epsilon);
      const logU = new Float64Array(rows);
      const logV = new Float64Array(cols);
      for (let i = 0; i < rows; i += 1) {
        logU[i] = config.warmStart?.logU?.[i] ?? 0;
      }
      for (let j = 0; j < cols; j += 1) {
        logV[j] = config.warmStart?.logV?.[j] ?? 0;
      }

      const logMu = Float64Array.from(mu, safeLog);
      const logNu = Float64Array.from(nu, safeLog);

      const history: SinkhornIterate[] = [];
      let converged = false;

      for (let iter = 0; iter < maxIterations; iter += 1) {
        const span = tracer.startSpan('sb.sinkhorn.iter');
        span.setAttribute('sb.iter', iter);
        span.setAttribute('sb.epsilon', config.epsilon);

        for (let i = 0; i < rows; i += 1) {
          const lse = logSumExpRow(logKernel, logV, i, cols, clamp);
          logU[i] = logMu[i] - lse;
        }

        for (let j = 0; j < cols; j += 1) {
          const lse = logSumExpColumn(logKernel, logU, j, rows, cols, clamp);
          logV[j] = logNu[j] - lse;
        }

        let marginalError = 0;
        if (iter % checkInterval === 0 || iter === maxIterations - 1) {
          const marginals = computeMarginals(logKernel, logU, logV, rows, cols);
          marginalError = Math.max(l1NormDiff(marginals.left, mu), l1NormDiff(marginals.right, nu));
          const coupling = computeCoupling(logKernel, logU, logV, rows, cols);
          const diagnostics = computeDiagnostics({
            coupling,
            cost,
            mu,
            nu,
            epsilon: config.epsilon
          });
          const dualGap = Math.abs(diagnostics.primal - diagnostics.dual);
          history.push({ iteration: iter, marginalError, dualGap });
          span.setAttribute('sb.marginal_error', marginalError);
          span.setAttribute('sb.dual_gap', dualGap);
          if (marginalError < tolerance) {
            converged = true;
            span.end();
            break;
          }
        }

        span.end();
      }

      const coupling = computeCoupling(logKernel, logU, logV, rows, cols);
      const diagnostics = computeDiagnostics({
        coupling,
        cost,
        mu,
        nu,
        epsilon: config.epsilon
      });

      return {
        u: Float64Array.from(logU, (v) => Math.exp(v)),
        v: Float64Array.from(logV, (v) => Math.exp(v)),
        logU,
        logV,
        coupling,
        iterations: history.length > 0 ? history[history.length - 1].iteration + 1 : 0,
        converged,
        history,
        diagnostics
      };
    } finally {
      trace.getSpan(context.active())?.end();
    }
  });
}
