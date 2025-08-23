/* eslint-disable */
/**
 * Qutrit math utilities (complex amplitudes, density-operator, SU(3), unitary/Lindblad).
 * No external deps; uses native JS number arrays. Angles in radians. Logs base-2 by default.
 *
 * State conventions:
 *  - Pure state |ψ> = [a, b, c] with a,b,c ∈ ℂ (represented as [re, im] tuples).
 *  - Density operator ρ ∈ ℂ^{3x3}.
 *  - Observables Hermitian 3x3.
 */
export type C = [number, number]; // [re, im]
export type C3 = [C, C, C];
export type C3x3 = [C[], C[], C[]]; // row-major (3 rows of 3 complex)

const I: C = [0, 1];
const ZERO: C = [0, 0];
const ONE: C = [1, 0];
const EPS = 1e-12;

// --- Complex helpers ---
export function c(re = 0, im = 0): C {
  return [re, im];
}
export function cAdd([ar, ai]: C, [br, bi]: C): C {
  return [ar + br, ai + bi];
}
export function cSub(a: C, b: C): C {
  return cAdd(a, cNeg(b));
}
export function cNeg([ar, ai]: C): C {
  return [-ar, -ai];
}
export function cMul([ar, ai]: C, [br, bi]: C): C {
  return [ar * br - ai * bi, ar * bi + ai * br];
}
export function cConj([ar, ai]: C): C {
  return [ar, -ai];
}
export function cAbs2([ar, ai]: C): number {
  return ar * ar + ai * ai;
}
export function cScale([ar, ai]: C, s: number): C {
  return [ar * s, ai * s];
}
export function cDiv(a: C, b: C): C {
  const d = cAbs2(b) || EPS;
  const [cr, ci] = cConj(b);
  return cScale(cMul(a, [cr, ci]), 1 / d);
}
// --- Linear algebra on 3x3 complex ---
export function mId(): C3x3 {
  return [
    [ONE, ZERO, ZERO],
    [ZERO, ONE, ZERO],
    [ZERO, ZERO, ONE],
  ];
}
export function mZero(): C3x3 {
  return [
    [ZERO, ZERO, ZERO],
    [ZERO, ZERO, ZERO],
    [ZERO, ZERO, ZERO],
  ];
}
export function mConjT(A: C3x3): C3x3 {
  return [
    [cConj(A[0][0]), cConj(A[1][0]), cConj(A[2][0])],
    [cConj(A[0][1]), cConj(A[1][1]), cConj(A[2][1])],
    [cConj(A[0][2]), cConj(A[1][2]), cConj(A[2][2])],
  ];
}
export function mAdd(A: C3x3, B: C3x3): C3x3 {
  const R = mZero();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = cAdd(A[i][j], B[i][j]);
  return R;
}
export function mSub(A: C3x3, B: C3x3): C3x3 {
  const R = mZero();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = cSub(A[i][j], B[i][j]);
  return R;
}
export function mMul(A: C3x3, B: C3x3): C3x3 {
  const R = mZero();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s: C = [0, 0];
      for (let k = 0; k < 3; k++) s = cAdd(s, cMul(A[i][k], B[k][j]));
      R[i][j] = s;
    }
  return R;
}
export function vNormalize(v: C3): C3 {
  const n = Math.sqrt(cAbs2(v[0]) + cAbs2(v[1]) + cAbs2(v[2])) || 1;
  return [cDiv(v[0], [n, 0]), cDiv(v[1], [n, 0]), cDiv(v[2], [n, 0])];
}
export function ket(a: C3): C3 {
  return vNormalize(a);
}
export function bra(a: C3): C3 {
  return a.map(cConj) as C3;
}
export function outer(psi: C3): C3x3 {
  // |ψ><ψ|
  const br = bra(psi);
  const R = mZero();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = cMul(psi[i], br[j]);
  return R;
}
export function trace(A: C3x3): C {
  return cAdd(cAdd(A[0][0], A[1][1]), A[2][2]);
}
export function trReal(A: C3x3): number {
  return trace(A)[0];
}

/** Probabilities in computational basis {|-1>,|0>,|+1>} for pure state */
export function probs(psi: C3): [number, number, number] {
  const p = [cAbs2(psi[0]), cAbs2(psi[1]), cAbs2(psi[2])] as [number, number, number];
  const Z = p[0] + p[1] + p[2] || 1;
  return [p[0] / Z, p[1] / Z, p[2] / Z];
}

/** Density operator from pure state */
export function rhoPure(psi: C3): C3x3 {
  return outer(ket(psi));
}

/** Purity Tr(ρ^2) */
export function purity(rho: C3x3): number {
  return trReal(mMul(rho, rho));
}

/** Von Neumann entropy: H(ρ) = -Tr(ρ log ρ) (base-2). Uses eigenvalues via cubic closed-form. */
export function entropy(rho: C3x3, base2 = true): number {
  const ev = eigenvaluesHermitian(rho); // real, >=0, sum=1
  const log = (x: number) => (base2 ? Math.log2(x) : Math.log(x));
  return -ev.reduce((s, l) => s + (l > EPS ? l * log(l) : 0), 0);
}

/** Expectation ⟨A⟩ = Tr(ρ A) */
export function expect(rho: C3x3, A: C3x3): number {
  return trReal(mMul(rho, A));
}

/** Variance Var(A)=⟨A^2⟩-⟨A⟩^2 */
export function variance(rho: C3x3, A: C3x3): number {
  const mu = expect(rho, A);
  const mu2 = trReal(mMul(rho, mMul(A, A)));
  return Math.max(0, mu2 - mu * mu);
}
// --- SU(3): Gell-Mann matrices λ1..λ8 (Hermitian, traceless) ---
export function su3(): C3x3[] {
  const z = ZERO;
  const o = ONE;
  const n = ([x]: number[] = [-1]) => c(x, 0);
  const re = (x: number) => c(x, 0);
  const im = (x: number) => c(0, x);
  const λ1: C3x3 = [
    [z, o, z],
    [o, z, z],
    [z, z, z],
  ];
  const λ2: C3x3 = [
    [z, im(-1), z],
    [im(1), z, z],
    [z, z, z],
  ];
  const λ3: C3x3 = [
    [o, z, z],
    [z, n([1]), z],
    [z, z, z],
  ]; // diag(1,-1,0)
  const λ4: C3x3 = [
    [z, z, o],
    [z, z, z],
    [o, z, z],
  ];
  const λ5: C3x3 = [
    [z, z, im(-1)],
    [z, z, z],
    [im(1), z, z],
  ];
  const λ6: C3x3 = [
    [z, z, z],
    [z, z, o],
    [z, o, z],
  ];
  const λ7: C3x3 = [
    [z, z, z],
    [z, z, im(-1)],
    [z, im(1), z],
  ];
  const λ8: C3x3 = [
    [re(1 / Math.sqrt(3)), z, z],
    [z, re(1 / Math.sqrt(3)), z],
    [z, z, re(-2 / Math.sqrt(3))],
  ];
  return [λ1, λ2, λ3, λ4, λ5, λ6, λ7, λ8];
}

/** Bloch-like 8D vector for qutrit: r_i = Tr(ρ λ_i) */
export function bloch8(rho: C3x3): number[] {
  return su3().map((L) => trReal(mMul(rho, L)));
}

/** Projective measurement in computational basis. Returns outcome index and post-measurement ρ. */
export function measureComputational(rho: C3x3): {
  outcome: -1 | 0 | 1;
  rhoPost: C3x3;
  prob: number;
} {
  const Pm = [
    // projectors |i><i|
    [
      [ONE, ZERO, ZERO],
      [ZERO, ZERO, ZERO],
      [ZERO, ZERO, ZERO],
    ],
    [
      [ZERO, ZERO, ZERO],
      [ZERO, ONE, ZERO],
      [ZERO, ZERO, ZERO],
    ],
    [
      [ZERO, ZERO, ZERO],
      [ZERO, ZERO, ZERO],
      [ZERO, ZERO, ONE],
    ],
  ] as C3x3[];
  const probs = Pm.map((P) => trReal(mMul(rho, P)));
  const r = Math.random();
  let cum = 0;
  let idx = 0;
  for (let i = 0; i < 3; i++) {
    cum += probs[i];
    if (r <= cum) {
      idx = i;
      break;
    }
  }
  const P = Pm[idx];
  const num = mMul(mMul(P, rho), P);
  const p = Math.max(probs[idx], EPS);
  const rhoPost = mScale(num, 1 / p);
  return { outcome: ([-1, 0, 1] as const)[idx], rhoPost, prob: probs[idx] };
}

export function mScale(A: C3x3, s: number): C3x3 {
  const R = mZero();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = cScale(A[i][j], s);
  return R;
}

// --- Time evolution ---
// U(t) = exp(-i H t). Here we diagonalize H = V D V† (Hermitian), then U = V exp(-i D t) V†
export function evolveUnitary(rho0: C3x3, H: C3x3, t: number): C3x3 {
  const { V, D } = eigHermitian(H); // D real diag
  const eDt = expDiag(D, -t); // exp(-i * D * t)
  const Vd = mConjT(V);
  const U = mMul(mMul(V, eDt), Vd);
  const Ud = mConjT(U);
  return mMul(mMul(U, rho0), Ud);
}

/** Simple diagonal dephasing (Lindblad) in computational basis with rates γ_i ≥ 0. */
export function evolveLindbladDephasing(
  rho0: C3x3,
  H: C3x3,
  t: number,
  gamma: [number, number, number] = [0, 0, 0]
): C3x3 {
  let ρt = evolveUnitary(rho0, H, t);
  // exponential decay of off-diagonals: ρ_ij -> ρ_ij * exp(-0.5*(γ_i+γ_j)*t)
  const R = mZero();
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const g = i === j ? 0 : 0.5 * ((gamma[i] || 0) + (gamma[j] || 0));
      const factor = Math.exp(-g * Math.abs(t));
      R[i][j] = cScale(ρt[i][j], factor);
    }
  return R;
}
// --- Eigen machinery (Hermitian 3x3) ---
// For stability and simplicity here we go via numeric Jacobi sweeps (good enough for viz).
export function eigHermitian(H: C3x3): { V: C3x3; D: number[] } {
  // Convert to real-symmetric by asserting H is Hermitian and using real parts (imag should be tiny on diagonal)
  const A = [
    [H[0][0][0], H[0][1][0], H[0][2][0]],
    [H[1][0][0], H[1][1][0], H[1][2][0]],
    [H[2][0][0], H[2][1][0], H[2][2][0]],
  ];
  let V = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  // Jacobi iterations
  for (let iter = 0; iter < 50; iter++) {
    // find largest off-diagonal
    let p = 0,
      q = 1,
      max = 0;
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        const v = Math.abs(A[i][j]);
        if (v > max) {
          max = v;
          p = i;
          q = j;
        }
      }
    if (max < 1e-12) break;
    const phi = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]);
    const c = Math.cos(phi),
      s = Math.sin(phi);
    // rotate A
    const App = c * c * A[p][p] - 2 * s * c * A[p][q] + s * s * A[q][q];
    const Aqq = s * s * A[p][p] + 2 * s * c * A[p][q] + c * c * A[q][q];
    const Apq = 0;
    const Aip = [A[0][p], A[1][p], A[2][p]];
    const Aiq = [A[0][q], A[1][q], A[2][q]];
    for (let i = 0; i < 3; i++) {
      if (i !== p && i !== q) {
        const Aip_new = c * Aip[i] - s * Aiq[i];
        const Aiq_new = s * Aip[i] + c * Aiq[i];
        A[i][p] = A[p][i] = Aip_new;
        A[i][q] = A[q][i] = Aiq_new;
      }
    }
    A[p][p] = App;
    A[q][q] = Aqq;
    A[p][q] = A[q][p] = Apq;
    // rotate V
    for (let i = 0; i < 3; i++) {
      const Vip = V[i][p],
        Viq = V[i][q];
      V[i][p] = c * Vip - s * Viq;
      V[i][q] = s * Vip + c * Viq;
    }
  }
  // Build complex V from real V, and D diag
  const Vc: C3x3 = [
    [c(V[0][0], 0), c(V[0][1], 0), c(V[0][2], 0)],
    [c(V[1][0], 0), c(V[1][1], 0), c(V[1][2], 0)],
    [c(V[2][0], 0), c(V[2][1], 0), c(V[2][2], 0)],
  ];
  const D = [A[0][0], A[1][1], A[2][2]];
  return { V: Vc, D };
}

function expDiag(D: number[], signT: number): C3x3 {
  // exp(-i D t) where signT = -t
  const U = mZero();
  for (let i = 0; i < 3; i++) {
    const theta = D[i] * -signT; // actually: -D_i * t ; we pass -t
    U[i][i] = [Math.cos(theta), -Math.sin(theta)];
  }
  return U;
}

/** Simple Hermitian Hamiltonian builder from SU(3): H = Σ θ_i λ_i + ω I */
export function hamiltonianSU3(theta: number[], omega0 = 0): C3x3 {
  const L = su3();
  let H = mScale(mId(), omega0);
  for (let i = 0; i < Math.min(theta.length, L.length); i++) {
    H = mAdd(H, mScale(L[i], theta[i]));
  }
  return H;
}

/** Creative boundary energy K_c model (from your earlier formula). */
export function creativeEnergy(
  sigmaC: number,
  gamma: number,
  chi: number,
  lambda: number,
  deltaU: number
): number {
  const num = sigmaC * (1 + gamma) * (1 + chi * Math.abs(deltaU));
  const den = 1 + lambda * Math.abs(deltaU);
  return num / Math.max(den, EPS);
}
