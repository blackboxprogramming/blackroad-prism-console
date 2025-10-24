import { rounded } from '../determinism';

export interface EigenPair {
  value: number;
  vector: number[];
}

export function jacobiEigenDecomposition(matrix: number[][], tolerance = 1e-8, maxIterations = 100): EigenPair[] {
  const n = matrix.length;
  const a = matrix.map((row) => row.slice());
  const eigenvectors: number[][] = Array.from({ length: n }, (_, i) => {
    const basis = Array(n).fill(0);
    basis[i] = 1;
    return basis;
  });
  for (let iter = 0; iter < maxIterations; iter += 1) {
    let p = 0;
    let q = 1;
    let max = Math.abs(a[p][q]);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const val = Math.abs(a[i][j]);
        if (val > max) {
          max = val;
          p = i;
          q = j;
        }
      }
    }
    if (max < tolerance) {
      break;
    }
    const theta = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    for (let i = 0; i < n; i += 1) {
      const api = a[p][i];
      const aqi = a[q][i];
      a[p][i] = cos * api - sin * aqi;
      a[q][i] = sin * api + cos * aqi;
    }
    for (let i = 0; i < n; i += 1) {
      const aip = a[i][p];
      const aiq = a[i][q];
      a[i][p] = cos * aip - sin * aiq;
      a[i][q] = sin * aip + cos * aiq;
    }
    for (let i = 0; i < n; i += 1) {
      const vip = eigenvectors[i][p];
      const viq = eigenvectors[i][q];
      eigenvectors[i][p] = cos * vip - sin * viq;
      eigenvectors[i][q] = sin * vip + cos * viq;
    }
  }
  const result: EigenPair[] = [];
  for (let i = 0; i < n; i += 1) {
    result.push({ value: rounded(a[i][i]), vector: eigenvectors.map((row) => row[i]) });
  }
  result.sort((lhs, rhs) => lhs.value - rhs.value);
  return result;
}

export function smallestKEigenpairs(matrix: number[][], k: number): EigenPair[] {
  const all = jacobiEigenDecomposition(matrix);
  return all.slice(0, k);
}
