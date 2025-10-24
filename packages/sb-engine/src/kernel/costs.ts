import { CostMatrixOptions, CostMetric } from '../types.js';

function normalizeCosine(points: number[][]): number[][] {
  return points.map((row) => {
    const norm = Math.sqrt(row.reduce((acc, v) => acc + v * v, 0)) || 1;
    return row.map((v) => v / norm);
  });
}

function squaredEuclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  const clampDot = Math.min(1, Math.max(-1, dot));
  return 1 - clampDot;
}

function tvL1(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

const metricFn: Record<CostMetric, (a: number[], b: number[]) => number> = {
  l2: squaredEuclidean,
  cosine: cosineDistance,
  tv_l1: tvL1
};

export interface CostMatrixResult {
  matrix: Float64Array;
  rows: number;
  cols: number;
}

export function computeCostMatrix(
  xs: number[][],
  ys: number[][],
  options: CostMatrixOptions = {}
): CostMatrixResult {
  const metric = options.metric ?? 'l2';
  const tileSize = options.tileSize ?? Math.max(32, Math.floor(Math.sqrt(xs.length * ys.length)));
  const xPoints = metric === 'cosine' && options.cosineNormalize ? normalizeCosine(xs) : xs;
  const yPoints = metric === 'cosine' && options.cosineNormalize ? normalizeCosine(ys) : ys;

  const rows = xPoints.length;
  const cols = yPoints.length;
  const matrix = new Float64Array(rows * cols);
  const fn = metricFn[metric];

  const tileR = Math.max(1, tileSize);
  const tileC = Math.max(1, tileSize);

  for (let rowStart = 0; rowStart < rows; rowStart += tileR) {
    const rowEnd = Math.min(rows, rowStart + tileR);
    for (let colStart = 0; colStart < cols; colStart += tileC) {
      const colEnd = Math.min(cols, colStart + tileC);
      for (let i = rowStart; i < rowEnd; i += 1) {
        for (let j = colStart; j < colEnd; j += 1) {
          const idx = i * cols + j;
          matrix[idx] = fn(xPoints[i], yPoints[j]);
        }
      }
    }
  }

  return { matrix, rows, cols };
}
