# Deriving the Explicit Formula for the Chebyshev Function

This note documents how the Chebyshev function
\(\psi(x) = \sum_{n \le x} \Lambda(n)\)
relates primes to the non-trivial zeros of the Riemann zeta function. The goal is to
record each contour contribution explicitly so the derivation can be reused in
later arguments about prime gaps and zero-free regions.

## 1. Logarithmic derivative of \(\zeta(s)\)

For \(\Re(s) > 1\) we have the absolutely convergent Dirichlet series

\[
-\frac{\zeta'(s)}{\zeta(s)} = \sum_{n=1}^{\infty} \frac{\Lambda(n)}{n^s},
\]

where \(\Lambda\) denotes the von Mangoldt function. This analytic encoding of
prime powers will be inverted to recover \(\psi(x)\).

## 2. Mellin inversion

Let \(c>1\). Mellin inversion of the Dirichlet series gives

\[
\psi(x) = \frac{1}{2\pi i} \int_{c-i\infty}^{c+i\infty}
-\frac{\zeta'(s)}{\zeta(s)} \frac{x^{s}}{s} \, ds.
\]

Expanding the integrand into its Dirichlet series and integrating term-by-term
recovers the partial sums of \(\Lambda(n)\), hence \(\psi(x)\).

## 3. Shifting the contour

Shift the line of integration to the left, to \(\Re(s)=\sigma\) with
\(\sigma < 0\). The integral on the new line vanishes in the limit because of
standard decay estimates for \(\Gamma(s/2)\) and boundedness of
\(\zeta'(s)/\zeta(s)\) inside vertical strips. The integral equals the sum of
residues enclosed during the shift:

1. **Simple pole at \(s=1\):**
   \( -\zeta'/\zeta \) has residue 1 at \(s=1\), so the contribution is
   \(x\).

2. **Non-trivial zeros \(\rho\):**
   Each non-trivial zero \(\rho\) of \(\zeta\) contributes
   \(-x^{\rho}/\rho\).

3. **Trivial zeros at \(-2,-4,\ldots\):**
   Collectively these give
   \(-\tfrac12 \log(1 - x^{-2})\).

4. **Pole from the \(\Gamma\)-factor:**
   The factor \(\pi^{-s/2} \Gamma(s/2)\) appearing in the functional equation
   contributes the constant term \(-\log 2\pi\).

Putting everything together yields the explicit formula

\[
\psi(x) = x - \sum_{\rho} \frac{x^{\rho}}{\rho} - \log 2\pi
- \tfrac12 \log(1 - x^{-2}),
\]

with the sum running over non-trivial zeros \(\rho\) of \(\zeta(s)\).

## 4. Interpretation

- The main term \(x\) reflects the expected growth of \(\psi(x)\).
- Oscillations in \(\psi(x) - x\) arise entirely from the terms
  \(x^{\rho}/\rho\).
- Trivial zeros and the \(\Gamma\)-factor supply explicit lower-order
  corrections.
- If every zero satisfies \(\Re(\rho) = 1/2\) (Riemann Hypothesis), the error
  term becomes \(O\bigl(x^{1/2+\varepsilon}\bigr)\), capturing the sharpest
  conjectured bound on prime-counting fluctuations.

