/**
 * Deterministic linear congruential generator with 32-bit state.
 */
export class DeterministicRng {
  private state: number;

  constructor(seed: number) {
    if (!Number.isFinite(seed)) {
      throw new Error('Seed must be finite');
    }
    const normalised = Math.abs(Math.floor(seed));
    this.state = (normalised >>> 0) || 1;
  }

  next(): number {
    // glibc style LCG constants
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      throw new Error('maxExclusive must be positive');
    }
    return Math.floor(this.next() * maxExclusive);
  }

  shuffle<T>(values: T[]): T[] {
    const arr = [...values];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
