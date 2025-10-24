export function logSumExp(values: Float64Array): number {
  let maxVal = -Infinity;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] > maxVal) {
      maxVal = values[i];
    }
  }
  if (!Number.isFinite(maxVal)) {
    return -Infinity;
  }
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += Math.exp(values[i] - maxVal);
  }
  return maxVal + Math.log(sum);
}

export function logSumExpWithClamp(values: Float64Array, clamp: number): number {
  const buffer = new Float64Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    buffer[i] = Math.max(-clamp, Math.min(clamp, values[i]));
  }
  return logSumExp(buffer);
}

export function logSumExpRow(
  logKernel: Float64Array,
  logV: Float64Array,
  row: number,
  cols: number,
  clamp?: number
): number {
  const scratch = new Float64Array(cols);
  for (let j = 0; j < cols; j += 1) {
    scratch[j] = logKernel[row * cols + j] + logV[j];
  }
  return clamp ? logSumExpWithClamp(scratch, clamp) : logSumExp(scratch);
}

export function logSumExpColumn(
  logKernel: Float64Array,
  logU: Float64Array,
  col: number,
  rows: number,
  cols: number,
  clamp?: number
): number {
  const scratch = new Float64Array(rows);
  for (let i = 0; i < rows; i += 1) {
    scratch[i] = logKernel[i * cols + col] + logU[i];
  }
  return clamp ? logSumExpWithClamp(scratch, clamp) : logSumExp(scratch);
}
