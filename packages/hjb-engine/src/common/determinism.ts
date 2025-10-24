export type RNG = () => number;

export function createDeterministicRng(seed: number): RNG {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export function withDeterministicMath<T>(seed: number, fn: (rng: RNG) => T): T {
  const originalRandom = Math.random;
  const rng = createDeterministicRng(seed);
  (Math as unknown as { random: RNG }).random = rng;
  try {
    return fn(rng);
  } finally {
    (Math as unknown as { random: RNG }).random = originalRandom;
  }
}
