export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

export function identity(size: number): number[][] {
  return Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
  );
}

export function jacobiEigenDecomposition(
  matrix: number[][],
  maxIterations = 64,
  tolerance = 1e-10
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  const a = cloneMatrix(matrix);
  const v = identity(n);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    let p = 0;
    let q = 1;
    let max = Math.abs(a[p][q]);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const value = Math.abs(a[i][j]);
        if (value > max) {
          max = value;
          p = i;
          q = j;
        }
      }
    }
    if (max < tolerance) {
      break;
    }
    const phi = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    for (let i = 0; i < n; i += 1) {
      const api = a[p][i];
      const aqi = a[q][i];
      a[p][i] = c * api - s * aqi;
      a[q][i] = s * api + c * aqi;
      a[i][p] = a[p][i];
      a[i][q] = a[q][i];

      const vip = v[i][p];
      const viq = v[i][q];
      v[i][p] = c * vip - s * viq;
      v[i][q] = s * vip + c * viq;
    }
    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = 0;
    a[q][p] = 0;
  }

  const eigenvalues = Array.from({ length: n }, (_, i) => a[i][i]);
  const eigenvectors = v;
  return { eigenvalues, eigenvectors };
}
