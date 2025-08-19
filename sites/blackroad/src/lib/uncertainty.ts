import type { C3x3 } from './qutrit';
import { expect, variance as varQ, mComm, center, mMul, mAdd, mScale, trReal, mId } from './qutrit';

/** Robertson–Schrödinger for two observables A,B (Hermitian):
 * ΔA² ΔB² ≥ |½⟨[A,B]⟩|² + |½⟨{A',B'}⟩|²
 */
export function robertsonSchrodinger(rho: C3x3, A: C3x3, B: C3x3) {
  const dA2 = varQ(rho, A);
  const dB2 = varQ(rho, B);
  const AB = mComm(A, B);
  const comm = 0.5 * trReal(mMul(rho, AB));
  const A1 = center(rho, A);
  const B1 = center(rho, B);
  const anti = 0.5 * trReal(mMul(rho, mAdd(mMul(A1, B1), mMul(B1, A1))));
  const rhs = comm * comm + anti * anti;
  const lhs = dA2 * dB2;
  return {
    dA2,
    dB2,
    lhs,
    commTerm: comm * comm,
    antiTerm: anti * anti,
    rhs,
    satisfied: lhs + 1e-12 >= rhs,
  };
}

/** Spin-1 triple (Sx,Sy,Sz) sum-of-variances bound:
 * Var(Sx)+Var(Sy)+Var(Sz) ≥ s  (with ħ=1). For spin-1, s=1.
 */
export function spin1TripleBound(rho: C3x3, Sx: C3x3, Sy: C3x3, Sz: C3x3) {
  const vx = varQ(rho, Sx),
    vy = varQ(rho, Sy),
    vz = varQ(rho, Sz);
  const ex = expect(rho, Sx),
    ey = expect(rho, Sy),
    ez = expect(rho, Sz);
  const sumVar = vx + vy + vz;
  const s = 1;
  const lb = s;
  const normE = Math.sqrt(ex * ex + ey * ey + ez * ez);
  return { sumVar, lowerBound: lb, satisfied: sumVar + 1e-12 >= lb, ex, ey, ez, normE };
}

export function pairwiseBounds(rho: C3x3, A: C3x3, B: C3x3, C: C3x3) {
  return {
    AB: robertsonSchrodinger(rho, A, B),
    BC: robertsonSchrodinger(rho, B, C),
    CA: robertsonSchrodinger(rho, C, A),
  };
}
