export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
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
