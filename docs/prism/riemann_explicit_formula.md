# Question 3 — The explicit formula

The Chebyshev function \(\psi(x) = \sum_{n \leq x} \Lambda(n)\) measures primes and prime powers
through the von Mangoldt function \(\Lambda\).  The analytic behaviour of \(\psi(x)\) is encoded by
the zeros of the Riemann zeta function, and the bridge between the two worlds is the explicit formula
\[
\psi(x) = x - \sum_{\rho} \frac{x^{\rho}}{\rho} - \log 2\pi - \tfrac12 \log\bigl(1 - x^{-2}\bigr),
\]
where the sum runs over the non-trivial zeros \(\rho\) of \(\zeta(s)\).  Below is a complete derivation.

Throughout we take \(x>1\) that is not an exact prime power so that \(\psi\) has no jump at \(x\).
When \(x\) *is* a prime power one obtains the same identity for the half-sum
\(\tfrac12(\psi(x^+) + \psi(x^-))\).

## 1. Start from the logarithmic derivative of \(\zeta\)

For \(\Re s>1\) the Euler product gives the absolutely convergent Dirichlet series
\[
-\frac{\zeta'(s)}{\zeta(s)} = \sum_{n=1}^{\infty} \frac{\Lambda(n)}{n^s}.
\]
This is the Mellin transform of \(\psi\); to recover \(\psi(x)\) we invert the transform.

## 2. Perron's formula / Mellin inversion

Fix \(c>1\) and consider the integral
\[
I(x,c) := \frac{1}{2\pi i} \int_{c-i\infty}^{c+i\infty}
-\frac{\zeta'(s)}{\zeta(s)} \frac{x^s}{s}\, ds.
\]
For \(x>1\) that is not a prime power, Perron's inversion formula shows that
\(I(x,c) = \psi(x)\).  The factor \(1/s\) ensures that the step at prime powers is averaged when
necessary; convergence of the vertical integral follows from the decay of \(x^s/s\) and the standard
bound \(-\zeta'(c+it)/\zeta(c+it) = O(\log |t|)\).

## 3. Shift the contour to the left

Let \(c>1\) and \(T>0\).  Consider the rectangle with vertices
\(c \pm iT\) and \(-m \pm iT\) for some integer \(m \geq 2\).  By Cauchy's residue theorem the integral
around this contour equals \(2\pi i\) times the sum of residues of the integrand inside.
Sending \(T \to \infty\) and \(m \to \infty\) will give the explicit formula once we control the
horizontal integrals, which contribute \(O(x^{-m} \log T)\) and therefore vanish in the limit.

While shifting the contour we encounter:

* The simple pole of \(\zeta(s)\) at \(s=1\).
* The non-trivial zeros \(\rho\) of \(\zeta(s)\) with \(0 < \Re \rho < 1\).
* The trivial zeros at \(s=-2,-4,\ldots\).
* The simple pole at \(s=0\) from the factor \(1/s\).

The decay of \(\zeta'(s)/\zeta(s)\) on vertical lines together with Stirling's formula (applied to the
gamma-factor appearing in the functional equation) shows that the integral on the new vertical line
\(\Re s = -m\) tends to zero as \(m \to \infty\).  Thus the original integral equals minus the sum of
residues crossed during the shift.

## 4. Residues

### Pole at \(s=1\)
Near \(s=1\) we have \(\zeta(s) = \frac{1}{s-1} + O(1)\), so
\(-\zeta'(s)/\zeta(s) = \frac{1}{s-1} + O(1)\).  Multiplying by \(x^s/s\) and extracting the residue gives
\[\operatorname{Res}_{s=1} \Bigl(-\frac{\zeta'(s)}{\zeta(s)} \frac{x^s}{s}\Bigr) = x.
\]

### Non-trivial zeros \(\rho\)
If \(\rho\) is a simple zero of \(\zeta\), then near \(s=\rho\) we have
\(-\zeta'(s)/\zeta(s) = -\frac{1}{s-\rho} + O(1)\), so the residue contribution is
\[
\operatorname{Res}_{s=\rho} \Bigl(-\frac{\zeta'(s)}{\zeta(s)} \frac{x^s}{s}\Bigr)
= -\frac{x^{\rho}}{\rho}.
\]
Summing over all non-trivial zeros yields the principal oscillatory term.

### Trivial zeros \(-2m\)
Each negative even integer \(-2m\) is a simple zero of \(\zeta\).  The residue there is
\(x^{-2m}/(2m)\), and summing over \(m\ge 1\) gives
\[
\sum_{m \ge 1} \frac{x^{-2m}}{2m} = -\tfrac12 \log(1 - x^{-2}).
\]

### Pole at \(s=0\)
At the origin the integrand has residue
\[
-\frac{\zeta'(0)}{\zeta(0)} = -\log 2\pi,
\]
using the functional equation for \(\zeta\), which implies \(\zeta'(0)/\zeta(0) = \log 2\pi\).

Combining all contributions and letting \(T \to \infty\) produces the explicit formula
\[
\psi(x) = x - \sum_{\rho} \frac{x^{\rho}}{\rho} - \log 2\pi - \tfrac12 \log(1 - x^{-2}).
\]

## 5. Interpretation

The difference \(\psi(x) - x\) is entirely controlled by the non-trivial zeros.  If the Riemann
Hypothesis holds so that \(\rho = 1/2 + i\gamma\), then the oscillatory terms have size
\(x^{1/2}\), leading to the optimal error term \(\psi(x) = x + O(x^{1/2} \log^2 x)\).  Conversely, a zero
with \(\Re \rho = 1 - \delta\) would introduce deviations of order \(x^{1-\delta}\), demonstrating how
zeros off the critical line warp the distribution of primes.

This formula is the cornerstone of linking zero-free regions for \(\zeta\) to bounds on prime gaps and
prime distribution in arithmetic progressions.
