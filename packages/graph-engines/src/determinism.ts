import crypto from 'node:crypto';

export type RNG = () => number;

export function createSeededRng(seed: number | string): RNG {
  const buf = Buffer.isBuffer(seed)
    ? seed
    : crypto.createHash('sha256').update(String(seed)).digest();
  let state = buf.readUInt32LE(0);
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export function deterministicShuffle<T>(values: T[], seed: number | string): T[] {
  const rng = createSeededRng(seed);
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function rounded(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
