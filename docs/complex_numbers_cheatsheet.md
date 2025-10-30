# Complex Numbers Cheat Sheet

## Polar Form Essentials
- Any non-zero complex number \(z = a + bi\) can be written as \(z = r e^{i\theta}\) with
  - Radius: \(r = |z| = \sqrt{a^2 + b^2}\).
  - Angle: \(\theta = \operatorname{atan2}(b, a)\) to ensure the correct quadrant.
- Multiplication: \(r_1 e^{i\theta_1} \cdot r_2 e^{i\theta_2} = (r_1 r_2) e^{i(\theta_1 + \theta_2)}\).
- Powers: \((r e^{i\theta})^n = r^n e^{i n \theta}\).

## Euler and Trigonometric Identities
- Euler's formula: \(e^{i\theta} = \cos\theta + i \sin\theta\).
- Recover trig from exponentials:
  - \(\displaystyle \cos\theta = \frac{e^{i\theta} + e^{-i\theta}}{2}\)
  - \(\displaystyle \sin\theta = \frac{e^{i\theta} - e^{-i\theta}}{2i}\)

## Roots via De Moivre's Theorem
- For \(z = r e^{i\theta}\), the \(n\)th roots are
  \[
  z_k = r^{1/n} e^{\,i(\theta + 2\pi k)/n}, \qquad k = 0, 1, \dotsc, n-1.
  \]
- The roots have equal magnitudes and are spaced evenly by angle \(2\pi/n\).

## Complex Logarithm
- The complex logarithm is multivalued:
  \[
  \log(re^{i\theta}) = \ln r + i(\theta + 2\pi k), \qquad k \in \mathbb{Z}.
  \]
- Always carry the \(2\pi k\) term to capture every branch (and every solution).

---

## Worked Examples

### Cube Roots of Unity (\(z^3 = 1\))
1. Express 1 in polar form: \(1 = e^{i(0 + 2\pi k)}\).
2. Apply the cube-root formula:
   \[
   z = e^{\,i(0 + 2\pi k)/3} = e^{\,i 2\pi k/3}, \qquad k = 0, 1, 2.
   \]
3. Convert to rectangular form: \(1\), \(-\tfrac{1}{2} + i \tfrac{\sqrt{3}}{2}\), \(-\tfrac{1}{2} - i \tfrac{\sqrt{3}}{2}\).

### Solving \(\sin x = 2\) in \(\mathbb{C}\)
1. Start from the exponential definition:
   \(\displaystyle \frac{e^{ix} - e^{-ix}}{2i} = 2\) \(\Rightarrow e^{2ix} - 1 = 4i e^{ix}.\)
2. Let \(u = e^{ix}\) to obtain \(u^2 - 4iu - 1 = 0\).
3. Solve the quadratic: discriminant \(\Delta = -12\), so \(\sqrt{\Delta} = i 2\sqrt{3}\).
4. Roots: \(u = i(2 \pm \sqrt{3})\).
5. Convert each \(u\) to polar form:
   - Magnitudes: \(|2 \pm \sqrt{3}| = 2 \pm \sqrt{3} > 0\).
   - Angles: each lies on the positive imaginary axis, so \(\arg = \pi/2 + 2\pi k\).
6. Take logs:
   \[
   ix = \ln(2 \pm \sqrt{3}) + i\Bigl(\tfrac{\pi}{2} + 2\pi k\Bigr)
   \Rightarrow
   x = -i\ln(2 \pm \sqrt{3}) + \tfrac{\pi}{2} + 2\pi k, \quad k \in \mathbb{Z}.
   \]

### Fourth Roots of \(-16i\)
1. Polar form: \(-16i = 16 e^{-i\pi/2}\) (equivalently \(16 e^{i 3\pi/2}\)).
2. Apply the root formula with \(n = 4\):
   \[
   z_k = 16^{1/4} e^{\,i((-\pi/2 + 2\pi k)/4)} = 2 e^{\,i(-\pi/8 + \pi k/2)}, \quad k = 0, 1, 2, 3.
   \]
3. Optionally convert each \(z_k\) to rectangular coordinates as needed.

---

## Reusable Templates

### Powers and Roots
1. Write \(z\) (or the target value) in polar form using \(\operatorname{atan2}\).
2. Apply \((r e^{i\theta})^n = r^n e^{in\theta}\) or the root formula.
3. Enumerate \(k = 0, 1, \dotsc, n-1\) for roots; convert to rectangular form if desired.

### Trig \(\rightarrow\) Exponential \(\rightarrow\) Solve
1. Replace \(\sin\) or \(\cos\) with the exponential identity.
2. Substitute \(u = e^{ix}\) (or \(e^{\pm ix}\) as appropriate) to obtain a polynomial.
3. Solve for \(u\); express solutions in polar form.
4. Use the multivalued log to solve for \(x\), keeping the \(2\pi k\) term.

---

## Intuition Snapshot
- Multiplying complex numbers multiplies magnitudes and adds angles, so exponentials linearize power operations.
- Trigonometric equations become algebraic in \(e^{ix}\); logarithms bring solutions back to \(x\).
- Remembering branch angles (via \(\operatorname{atan2}\) and \(2\pi k\)) prevents missed solutions.

