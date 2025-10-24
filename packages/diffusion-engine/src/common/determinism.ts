export interface DeterministicRng {
  next(): number;
  gauss(): number;
  gauss2(): [number, number];
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDeterministicRng(seed: number): DeterministicRng {
  const base = mulberry32(seed);
  let spare: number | null = null;
  return {
    next(): number {
      return base();
    },
    gauss(): number {
      if (spare !== null) {
        const value = spare;
        spare = null;
        return value;
      }
      let u = 0;
      let v = 0;
      while (u === 0) {
        u = base();
      }
      while (v === 0) {
        v = base();
      }
      const mag = Math.sqrt(-2.0 * Math.log(u));
      const z0 = mag * Math.cos(2 * Math.PI * v);
      const z1 = mag * Math.sin(2 * Math.PI * v);
      spare = z1;
      return z0;
    },
    gauss2(): [number, number] {
      return [this.gauss(), this.gauss()];
    }
  };
}
