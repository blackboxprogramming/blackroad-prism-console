const GOLDEN_SEED = 9713;

export interface SeededRng {
  seed: number;
  next(): number;
}

export function mulberry32(seed: number): SeededRng {
  let state = seed >>> 0;
  return {
    seed,
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
}

export function fixedRng(seed: number = GOLDEN_SEED): SeededRng {
  return mulberry32(seed);
}

export function deterministicShuffle<T>(values: T[], rng: SeededRng): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function deterministicNoise(length: number, rng: SeededRng): Float64Array {
  const noise = new Float64Array(length);
  for (let i = 0; i < length; i += 1) {
    noise[i] = rng.next() * 1e-6;
  }
  return noise;
}

export function goldenSeed(): number {
  return GOLDEN_SEED;
}
