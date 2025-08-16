export type C = [number, number];
export type C3 = [C, C, C];
export type C3x3 = [C3, C3, C3];

export const EPS = 1e-12;

export function c(re = 0, im = 0): C {
  return [re, im];
}

export function cAdd(a: C, b: C): C {
  return [a[0] + b[0], a[1] + b[1]];
}
export function cSub(a: C, b: C): C {
  return [a[0] - b[0], a[1] - b[1]];
}
export function cMul(a: C, b: C): C {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}
export function cScale(a: C, s: number): C {
  return [a[0] * s, a[1] * s];
}
export function cConj(a: C): C {
  return [a[0], -a[1]];
}
export function cAbs2(a: C): number {
  return a[0] * a[0] + a[1] * a[1];
}

export function ket(v: C3): C3 {
  const n = Math.sqrt(cAbs2(v[0]) + cAbs2(v[1]) + cAbs2(v[2]));
  if (n < EPS) return [c(1), c(), c()];
  return [cScale(v[0], 1 / n), cScale(v[1], 1 / n), cScale(v[2], 1 / n)];
}
export function bra(v: C3): C3 {
  return [cConj(v[0]), cConj(v[1]), cConj(v[2])];
}
export function probs(v: C3): number[] {
  return [cAbs2(v[0]), cAbs2(v[1]), cAbs2(v[2])];
}
export function rhoPure(psi: C3): C3x3 {
  const br = bra(psi);
  const out: C3x3 = [
    [c(), c(), c()],
    [c(), c(), c()],
    [c(), c(), c()],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i][j] = cMul(psi[i], br[j]);
    }
  }
  return out;
}

export function mZero(): C3x3 {
  return [
    [c(), c(), c()],
    [c(), c(), c()],
    [c(), c(), c()],
  ];
}

export function mAdd(A: C3x3, B: C3x3): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = cAdd(A[i][j], B[i][j]);
    }
  }
  return M;
}
export function mSub(A: C3x3, B: C3x3): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = cSub(A[i][j], B[i][j]);
    }
  }
  return M;
}
export function mScale(A: C3x3, s: number): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = cScale(A[i][j], s);
    }
  }
  return M;
}
export function mMul(A: C3x3, B: C3x3): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s: C = [0, 0];
      for (let k = 0; k < 3; k++) {
        s = cAdd(s, cMul(A[i][k], B[k][j]));
      }
      M[i][j] = s;
    }
  }
  return M;
}
export function mId(): C3x3 {
  const M = mZero();
  M[0][0] = c(1, 0);
  M[1][1] = c(1, 0);
  M[2][2] = c(1, 0);
  return M;
}
export function mConjT(A: C3x3): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = cConj(A[j][i]);
    }
  }
  return M;
}

export function tr(A: C3x3): C {
  return [A[0][0][0] + A[1][1][0] + A[2][2][0], A[0][0][1] + A[1][1][1] + A[2][2][1]];
}
export function trReal(A: C3x3): number {
  return tr(A)[0];
}

export function expect(rho: C3x3, A: C3x3): number {
  return trReal(mMul(rho, A));
}
export function variance(rho: C3x3, A: C3x3): number {
  const A2 = mMul(A, A);
  const eA2 = expect(rho, A2);
  const eA = expect(rho, A);
  return eA2 - eA * eA;
}

// Additional exports
export function mComm(A: C3x3, B: C3x3): C3x3 {
  return mSub(mMul(A, B), mMul(B, A));
}
export function mDag(A: C3x3): C3x3 {
  return mConjT(A);
}
export function mScalar(s: number): C3x3 {
  return mScale(mId(), s);
}
export function center(rho: C3x3, A: C3x3): C3x3 {
  return mSub(A, mScalar(expect(rho, A)));
}
export function inner(psi: C3, phi: C3): C {
  let s: C = [0, 0];
  const br = bra(psi);
  for (let i = 0; i < 3; i++) s = cAdd(s, cMul(br[i], phi[i]));
  return s;
}
export function innerAbs(psi: C3, phi: C3): number {
  const [re, im] = inner(psi, phi);
  return Math.hypot(re, im);
}
export function fsDistance(psi: C3, phi: C3): number {
  const r = Math.min(1, Math.max(0, innerAbs(psi, phi)));
  return Math.acos(r);
}
export function geodesicPoints(psi0: C3, psi1: C3, steps = 16): C3[] {
  const ψ0 = ket(psi0);
  const ψ1 = ket(psi1);
  const z = inner(ψ0, ψ1);
  const r = Math.min(1, Math.max(0, Math.hypot(z[0], z[1])));
  const φ = Math.atan2(z[1], z[0]);
  const θ = Math.acos(r);
  if (θ < 1e-12) return Array.from({ length: steps + 1 }, () => ψ0);
  const num: C3 = [
    cSub(ψ1[0], cMul(z, ψ0[0])),
    cSub(ψ1[1], cMul(z, ψ0[1])),
    cSub(ψ1[2], cMul(z, ψ0[2])),
  ];
  const denom = Math.sqrt(Math.max(1 - r * r, EPS));
  const η: C3 = [cScale(num[0], 1 / denom), cScale(num[1], 1 / denom), cScale(num[2], 1 / denom)];
  const eiphi: C = [Math.cos(φ), Math.sin(φ)];
  const out: C3[] = [];
  for (let k = 0; k <= steps; k++) {
    const τ = k / steps;
    const a = Math.cos(τ * θ),
      b = Math.sin(τ * θ);
    const v: C3 = [
      cAdd(cScale(ψ0[0], a), cMul(cScale(η[0], b), eiphi)),
      cAdd(cScale(ψ0[1], a), cMul(cScale(η[1], b), eiphi)),
      cAdd(cScale(ψ0[2], a), cMul(cScale(η[2], b), eiphi)),
    ];
    out.push(ket(v));
  }
  return out;
}
