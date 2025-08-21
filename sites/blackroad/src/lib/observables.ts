import type { C3x3 } from './qutrit';
import { c, mZero, mAdd, mConjT } from './qutrit';

/** Build Hermitian matrix from real rows */
export function hermitian(...rows: number[][]): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = c(rows[i]?.[j] || 0, 0);
    }
  }
  return M;
}

export function fromComplexRows(
  rows: [[number, number][], [number, number][], [number, number][]]
): C3x3 {
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = [rows[i][j][0], rows[i][j][1]];
    }
  }
  return M;
}

/** Spin-1 operators (ħ=1) in basis |-1>,|0>,|+1> */
const invSqrt2 = 1 / Math.sqrt(2);
export const Sz = hermitian([-1, 0, 1], [0, 0, 0], [0, 0, 0]);
export const Sx = fromComplexRows([
  [
    [0, 0],
    [invSqrt2, 0],
    [0, 0],
  ],
  [
    [invSqrt2, 0],
    [0, 0],
    [invSqrt2, 0],
  ],
  [
    [0, 0],
    [invSqrt2, 0],
    [0, 0],
  ],
]);
export const Sy = fromComplexRows([
  [
    [0, 0],
    [0, -invSqrt2],
    [0, 0],
  ],
  [
    [0, invSqrt2],
    [0, 0],
    [0, -invSqrt2],
  ],
  [
    [0, 0],
    [0, invSqrt2],
    [0, 0],
  ],
]);
export const Splus = fromComplexRows([
  [
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  [
    [Math.sqrt(2), 0],
    [0, 0],
    [0, 0],
  ],
  [
    [0, 0],
    [Math.sqrt(2), 0],
    [0, 0],
  ],
]);
export const Sminus = fromComplexRows([
  [
    [0, 0],
    [Math.sqrt(2), 0],
    [0, 0],
  ],
  [
    [0, 0],
    [0, 0],
    [Math.sqrt(2), 0],
  ],
  [
    [0, 0],
    [0, 0],
    [0, 0],
  ],
]);

/** Generalized Pauli/Weyl for d=3 (shift X, phase Z) */
export function Zq(): C3x3 {
  const ω1: [number, number] = [-0.5, Math.sqrt(3) / 2];
  const ω2: [number, number] = [-0.5, -Math.sqrt(3) / 2];
  return fromComplexRows([
    [
      [1, 0],
      [0, 0],
      [0, 0],
    ],
    [[0, 0], ω1, [0, 0]],
    [[0, 0], [0, 0], ω2],
  ]);
}
export function Xq(): C3x3 {
  return fromComplexRows([
    [
      [0, 0],
      [0, 0],
      [1, 0],
    ],
    [
      [1, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 0],
    ],
  ]);
}

export function hermitianPart(U: C3x3): C3x3 {
  const Ud = mConjT(U);
  const M = mZero();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const re = (U[i][j][0] + Ud[i][j][0]) / 2;
      const im = (U[i][j][1] + Ud[i][j][1]) / 2;
      M[i][j] = [re, im];
    }
  }
  return M;
}

export const Packs = {
  'Spin-1 (SU(2))': {
    Sx,
    Sy,
    Sz,
    Splus,
    Sminus,
  },
  'Weyl qutrit (d=3)': {
    X: Xq(),
    Z: Zq(),
    Xh: hermitianPart(Xq()),
    Zh: hermitianPart(Zq()),
  },
};
