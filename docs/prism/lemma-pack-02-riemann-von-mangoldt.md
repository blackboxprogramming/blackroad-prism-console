# Lemma Pack #2: Hadamard Product and the Riemann–von Mangoldt Zero Count

## Goal

Establish the classical asymptotic for the number of non-trivial zeros \(\rho = \beta + i\gamma\) of the Riemann zeta function with positive imaginary part at most \(T\):

\[
N(T) = \#\{\rho : 0 < \Im \rho \le T\} = \frac{T}{2\pi}\log\frac{T}{2\pi} - \frac{T}{2\pi} + O(\log T).
\]

The main ingredients are the Hadamard product for the completed zeta function \(\xi(s)\), the argument principle, and careful estimation of boundary integrals using Stirling's approximation.

---

## Step 1: Hadamard Product for \(\xi(s)\)

### Lemma 1 (Hadamard Factorization)
The entire function \(\xi(s) = \tfrac{1}{2}s(s-1)\pi^{-s/2}\Gamma(s/2)\zeta(s)\) admits the factorization
\[
\xi(s) = \xi(0) \prod_{\rho} \left(1 - \frac{s}{\rho}\right),
\]
where the product runs over the non-trivial zeros \(\rho\) of \(\zeta(s)\), each repeated according to multiplicity.

### Why this holds

- \(\xi(s)\) is entire (poles of \(\zeta(s)\) and \(\Gamma(s/2)\) cancel with the polynomial factor).
- The functional equation \(\xi(s) = \xi(1-s)\) shows zeros occur in pairs \(\rho\) and \(1-\rho\); symmetry about \(s=\tfrac{1}{2}\) implies \(\xi(s) = \xi(0) \prod_{\rho} \left(1 - \tfrac{s}{\rho}\right)\left(1 - \tfrac{s}{1-\rho}\right)\).
- Stirling's formula demonstrates that \(\xi(s)\) is of order 1, so Hadamard's factorization theorem applies without additional exponential factors.

---

## Step 2: Setting up the Argument Principle

Choose a rectangular contour with vertices at \(\sigma \pm iT\) and \(2 \pm iT\), where \(-1 \le \sigma < 0\) is fixed. The argument principle gives
\[
N(T) = \frac{1}{2\pi i} \oint_\mathcal{C} \frac{\xi'(s)}{\xi(s)}\,ds,
\]
where \(\mathcal{C}\) is the chosen contour and \(N(T)\) counts zeros inside the strip because \(\xi\) has no poles.

Using the logarithmic derivative of the defining product yields
\[
\frac{\xi'(s)}{\xi(s)} = \frac{1}{s} + \frac{1}{s-1} - \frac{1}{2}\log\pi + \frac{1}{2}\frac{\Gamma'(s/2)}{\Gamma(s/2)} + \frac{\zeta'(s)}{\zeta(s)}.
\]

---

## Step 3: Evaluating Boundary Integrals

Decompose the contour integral into four segments.

1. **Right vertical edge \(\Re s = 2\):** All factors are analytic and of moderate growth. Contributions from \(\frac{\zeta'}{\zeta}\) and \(\frac{\Gamma'}{\Gamma}\) are \(O(\log T)\).
2. **Left vertical edge \(\Re s = \sigma\):** Apply the functional equation \(\xi(s) = \xi(1-s)\) to transfer estimates from the right edge, again yielding \(O(\log T)\).
3. **Top and bottom horizontal edges \(\Im s = \pm T\):** Use Stirling's asymptotic expansion for \(\Gamma(s/2)\) and the polynomial factors to extract the leading \(\log T\) term. The contributions from \(\zeta'/\zeta\) are \(O(\log T)\) on these segments due to standard bounds for \(\zeta(s)\) off the critical line.

The dominant contribution arises from the integral of the logarithmic derivative of the \(\Gamma\) factor along the horizontal segments. Stirling's formula gives, for \(s = \sigma + iT\),
\[
\frac{\Gamma'(s/2)}{\Gamma(s/2)} = \log\left(\frac{T}{2}\right) + O\left(\frac{1}{T}\right),
\]
leading to the main \(\frac{T}{2\pi}\log T\) term when integrated across \(\sigma \le \Re s \le 2\).

---

## Step 4: Extracting the Asymptotic

Collecting the four sides of the contour and using the symmetry \(\xi(s) = \xi(1-s)\) reduces the argument principle integral to
\[
N(T) = \frac{1}{\pi} \arg \xi\!\left(\frac{1}{2} + iT\right) + O(1).
\]

Substituting the explicit formula for \(\xi(s)\) and applying Stirling's approximation for \(\Gamma(s/2)\) on the critical line yields
\[
\arg \xi\!\left(\frac{1}{2} + iT\right) = \frac{T}{2} \log\frac{T}{2\pi} - \frac{T}{2} + O(\log T).
\]
Consequently,
\[
N(T) = \frac{T}{2\pi}\log\frac{T}{2\pi} - \frac{T}{2\pi} + O(\log T).
\]

---

## Takeaways

- The Hadamard product isolates the zeros of \(\zeta(s)\) within \(\xi(s)\), enabling zero counts via analytic tools.
- The argument principle translates the change in argument of \(\xi\) along a contour into the number of enclosed zeros.
- Stirling's approximation for \(\Gamma(s/2)\) supplies the main asymptotic term, with all remaining contributions absorbed into \(O(\log T)\).

---

## Directions for Further Work

With the Riemann–von Mangoldt formula established, natural continuations include:

1. **Explicit prime-counting formulas:** Relate \(N(T)\) to oscillations in \(\psi(x)\) and \(\pi(x)\).
2. **Critical-line density results:** Study Hardy's theorem and zero-density estimates leading toward the Lindelöf hypothesis.
3. **Zero-free regions:** Quantify regions near \(\Re s = 1\) where \(\zeta(s) \ne 0\) to refine error terms in prime number theorems.
