import { Diagnostics, Vector } from '../types.js';

interface DiagnosticsInput {
  coupling: Float64Array;
  cost: Float64Array;
  mu: Vector;
  nu: Vector;
  epsilon: number;
}

export function computeDiagnostics(input: DiagnosticsInput): Diagnostics {
  const { coupling, cost, mu, nu, epsilon } = input;
  if (coupling.length !== cost.length) {
    throw new Error('Coupling and cost must have the same shape');
  }

  let costTerm = 0;
  let entropyTerm = 0;
  let kl = 0;

  const rows = mu.length;
  const cols = nu.length;

  const rowMarginals = new Float64Array(rows);
  const colMarginals = new Float64Array(cols);

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const idx = i * cols + j;
      const pij = coupling[idx];
      const cij = cost[idx];
      costTerm += pij * cij;
      if (pij > 0) {
        entropyTerm += pij * (Math.log(pij) - 1);
        kl += pij * (Math.log(pij) - Math.log(mu[i]) - Math.log(nu[j]));
      }
      rowMarginals[i] += pij;
      colMarginals[j] += pij;
    }
  }

  const marginalError = Math.max(
    rowMarginals.reduce((acc, v, idx) => acc + Math.abs(v - mu[idx]), 0),
    colMarginals.reduce((acc, v, idx) => acc + Math.abs(v - nu[idx]), 0)
  );

  const primal = costTerm + epsilon * entropyTerm;
  const dual = primal - epsilon * kl;

  return {
    marginalError,
    cost: costTerm,
    kl,
    primal,
    dual
  };
}
