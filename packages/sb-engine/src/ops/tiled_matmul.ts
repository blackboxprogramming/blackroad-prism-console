export interface TiledMatMulOptions {
  tileSize?: number;
  transpose?: boolean;
}

export function tiledMatVecMul(
  matrix: Float64Array,
  rows: number,
  cols: number,
  vector: Float64Array,
  options: TiledMatMulOptions = {}
): Float64Array {
  const tile = options.tileSize ?? 64;
  const result = new Float64Array(options.transpose ? cols : rows);

  if (options.transpose) {
    for (let colStart = 0; colStart < cols; colStart += tile) {
      const colEnd = Math.min(cols, colStart + tile);
      for (let i = 0; i < rows; i += 1) {
        for (let j = colStart; j < colEnd; j += 1) {
          result[j] += matrix[i * cols + j] * vector[i];
        }
      }
    }
  } else {
    for (let rowStart = 0; rowStart < rows; rowStart += tile) {
      const rowEnd = Math.min(rows, rowStart + tile);
      for (let i = rowStart; i < rowEnd; i += 1) {
        let acc = 0;
        for (let j = 0; j < cols; j += 1) {
          acc += matrix[i * cols + j] * vector[j];
        }
        result[i] = acc;
      }
    }
  }

  return result;
}
