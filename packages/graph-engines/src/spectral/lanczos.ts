function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

function maxOffDiagonal(matrix: number[][]): { value: number; i: number; j: number } {
  let value = 0;
  let iIdx = 0;
  let jIdx = 1;
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const absValue = Math.abs(matrix[i][j]);
      if (absValue > value) {
        value = absValue;
        iIdx = i;
        jIdx = j;
      }
    }
  }
  return { value, i: iIdx, j: jIdx };
}

export interface EigenDecomposition {
  values: number[];
  vectors: number[][];
}

export function jacobiEigenDecomposition(matrix: number[][], tolerance = 1e-10, maxIterations = 100): EigenDecomposition {
  const n = matrix.length;
  const a = cloneMatrix(matrix);
  const v = Array.from({ length: n }, (_, i) => {
    const row = Array(n).fill(0);
    row[i] = 1;
    return row;
  });

  for (let iter = 0; iter < maxIterations; iter += 1) {
    const { value: maxValue, i, j } = maxOffDiagonal(a);
    if (maxValue < tolerance) {
      break;
    }

    const diff = a[j][j] - a[i][i];
    const phi = 0.5 * Math.atan2(2 * a[i][j], diff);
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);

    for (let k = 0; k < n; k += 1) {
      const aik = a[i][k];
      const ajk = a[j][k];
      a[i][k] = cos * aik - sin * ajk;
      a[j][k] = sin * aik + cos * ajk;
    }

    for (let k = 0; k < n; k += 1) {
      const aki = a[k][i];
      const akj = a[k][j];
      a[k][i] = cos * aki - sin * akj;
      a[k][j] = sin * aki + cos * akj;
    }

    for (let k = 0; k < n; k += 1) {
      const vki = v[k][i];
      const vkj = v[k][j];
      v[k][i] = cos * vki - sin * vkj;
      v[k][j] = sin * vki + cos * vkj;
    }
  }

  const values = a.map((row, i) => row[i]);
  const vectors = v;
  return { values, vectors };
}

export function selectSmallestEigenpairs(matrix: number[][], k: number): EigenDecomposition {
  const { values, vectors } = jacobiEigenDecomposition(matrix);
  const indices = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const selectedValues = indices.slice(0, k).map((entry) => entry.value);
  const selectedVectors = indices.slice(0, k).map((entry) => vectors.map((row) => row[entry.index]));
  return { values: selectedValues, vectors: selectedVectors };
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
