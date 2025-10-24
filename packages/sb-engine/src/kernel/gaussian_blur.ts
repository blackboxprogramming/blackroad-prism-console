export interface GaussianBlurOptions {
  sigma?: number;
  radius?: number;
  iterations?: number;
}

function buildKernel(sigma: number, radius: number): Float64Array {
  const kernel = new Float64Array(radius * 2 + 1);
  const coeff = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  const denom = 2 * sigma * sigma;
  let norm = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const value = coeff * Math.exp(-(i * i) / denom);
    kernel[i + radius] = value;
    norm += value;
  }
  for (let i = 0; i < kernel.length; i += 1) {
    kernel[i] /= norm;
  }
  return kernel;
}

function apply1D(data: Float64Array, width: number, height: number, kernel: Float64Array, horizontal: boolean): Float64Array {
  const radius = (kernel.length - 1) / 2;
  const output = new Float64Array(data.length);
  if (horizontal) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let acc = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const ix = Math.min(width - 1, Math.max(0, x + k));
          acc += data[y * width + ix] * kernel[k + radius];
        }
        output[y * width + x] = acc;
      }
    }
  } else {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let acc = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const iy = Math.min(height - 1, Math.max(0, y + k));
          acc += data[iy * width + x] * kernel[k + radius];
        }
        output[y * width + x] = acc;
      }
    }
  }
  return output;
}

export function gaussianBlur(
  grid: Float64Array,
  width: number,
  height: number,
  options: GaussianBlurOptions = {}
): Float64Array {
  const sigma = options.sigma ?? 1.0;
  const radius = options.radius ?? Math.ceil(3 * sigma);
  const iterations = Math.max(1, options.iterations ?? 1);
  const kernel = buildKernel(sigma, radius);
  let current = grid;
  for (let i = 0; i < iterations; i += 1) {
    const horiz = apply1D(current, width, height, kernel, true);
    current = apply1D(horiz, width, height, kernel, false);
  }
  return current;
}
