# Complex Numbers in Polar Form

This guide summarizes how to express complex numbers in polar form and how to use De Moivre's formula when computing powers or roots.

## 1. Polar Form Refresher

Any complex number \(z = a + bi\) can be written as \(z = r e^{i\theta}\) where:

- \(r = \sqrt{a^2 + b^2}\) is the modulus (magnitude).
- \(\theta = \operatorname{atan2}(b, a)\) is the argument (angle, in radians).

This is a direct application of Euler's identity \(e^{i\theta} = \cos\theta + i\sin\theta\).

## 2. De Moivre's Formula for Powers

If \(z = r e^{i\theta}\) and \(n\) is an integer, then:

\[
z^n = r^n e^{in\theta}.
\]

**Example**

\[
(3 e^{i\pi/4})^3 = 3^3 e^{i 3\pi/4} = 27 e^{i 3\pi/4}.
\]

## 3. Converting Back to \(a + bi\)

Use cosine and sine to convert from polar form back to rectangular form:

\[
r e^{i\theta} = r (\cos\theta + i\sin\theta) = a + bi.
\]

**Example**

\[
27 e^{i 3\pi/4} = 27\left(\cos\frac{3\pi}{4} + i\sin\frac{3\pi}{4}\right) = 27\left(-\frac{\sqrt{2}}{2} + i\frac{\sqrt{2}}{2}\right) = -\frac{27\sqrt{2}}{2} + i\frac{27\sqrt{2}}{2}.
\]

## 4. Using De Moivre's Formula for Roots

The \(n\)-th roots of \(z = r e^{i\theta}\) are given by:

\[
z_k = r^{1/n} e^{i(\theta + 2\pi k)/n}, \quad k = 0, 1, \ldots, n - 1.
\]

**Example (cube roots of \(-8\))**

\[
-8 = 8 e^{i\pi}.
\]

The cube roots have modulus \(8^{1/3} = 2\) and arguments \((\pi + 2\pi k)/3\), producing:

- \(2 e^{i\pi/3}\)
- \(2 e^{i\pi}\)
- \(2 e^{i 5\pi/3}\)

## 5. Practice Examples

1. **\((1 + i)^5\)**

   - \(r = \sqrt{2}\), \(\theta = \pi/4\)
   - \((1 + i)^5 = (\sqrt{2})^5 e^{i 5\pi/4} = 4\sqrt{2} e^{i 5\pi/4} = -4 - 4i\)

2. **\([2(\cos 30^\circ + i\sin 30^\circ)]^4\)**

   - \(r = 2\), \(\theta = 30^\circ\)
   - \(2^4 e^{i 4 \cdot 30^\circ} = 16 e^{i 120^\circ} = -8 + 8\sqrt{3} i\)

## 6. Quick Reference Workflow

1. Convert \(a + bi\) to polar form by computing \(r\) and \(\theta\).
2. Apply De Moivre's formula to raise the number to a power or extract roots.
3. Convert the result back to rectangular form with cosine and sine.

These steps make it straightforward to tackle powers and roots of complex numbers using polar form.
