export function kl(p: Float32Array, q: Float32Array, eps = 1e-12): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], eps);
    const qi = Math.max(q[i], eps);
    sum += pi * (Math.log(pi) - Math.log(qi));
  }
  return sum;
}

export function js(p: Float32Array, q: Float32Array, eps = 1e-12): number {
  const m = new Float32Array(p.length);
  for (let i = 0; i < p.length; i++) {
    m[i] = 0.5 * (p[i] + q[i]);
  }
  return 0.5 * kl(p, m, eps) + 0.5 * kl(q, m, eps);
}

export function entropy(p: Float32Array, eps = 1e-12): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], eps);
    sum -= pi * Math.log(pi);
  }
  return sum;
}

export function mmdRbf(
  x: Float32Array,
  y: Float32Array,
  bandwidth?: number
): number {
  const n = x.length;
  const m = y.length;
  if (n !== m) {
    throw new Error('Arrays must have matching length for grid comparison');
  }
  const bw = bandwidth ?? estimateBandwidth(x, y);
  const gamma = -1 / (2 * bw * bw);
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const diff = x[i] - x[j];
      sumXX += Math.exp(gamma * diff * diff);
    }
  }
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      const diff = y[i] - y[j];
      sumYY += Math.exp(gamma * diff * diff);
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const diff = x[i] - y[j];
      sumXY += Math.exp(gamma * diff * diff);
    }
  }
  const denom = n * n + m * m - 2 * n * m;
  if (denom === 0) return 0;
  return sumXX / (n * n) + sumYY / (m * m) - (2 * sumXY) / (n * m);
}

function estimateBandwidth(x: Float32Array, y: Float32Array): number {
  let mean = 0;
  for (let i = 0; i < x.length; i++) mean += x[i];
  for (let i = 0; i < y.length; i++) mean += y[i];
  mean /= x.length + y.length;
  let varSum = 0;
  for (let i = 0; i < x.length; i++) {
    const diff = x[i] - mean;
    varSum += diff * diff;
  }
  for (let i = 0; i < y.length; i++) {
    const diff = y[i] - mean;
    varSum += diff * diff;
  }
  const variance = varSum / Math.max(x.length + y.length - 1, 1);
  return Math.sqrt(variance) + 1e-6;
}
