# Complex Numbers in Polar Form and De Moivre's Formula

This quick reference covers the essentials of representing complex numbers in polar form and applying De Moivre's formula for powers and roots.

## 1. Polar Form Refresher

Any complex number \( z = a + bi \) can be written as
\[
z = r e^{i\theta},
\]
where:

- \( r = \sqrt{a^2 + b^2} \) is the modulus (or length) of \( z \).
- \( \theta = \operatorname{atan2}(b, a) \) is the argument (or angle, in radians).

Euler's formula \( e^{i\theta} = \cos \theta + i \sin \theta \) ties the exponential and trigonometric forms together.

## 2. De Moivre's Formula for Powers

Given \( z = r e^{i\theta} \) and an integer \( n \), De Moivre's formula states
\[
z^n = r^n e^{in\theta}.
\]

**Example**

\[
\left(3 e^{i\pi/4}\right)^3 = 3^3 e^{i 3\pi/4} = 27 e^{i 3\pi/4}.
\]

## 3. Converting Back to Cartesian Form

To move from the polar form \( r e^{i\theta} \) back to \( a + bi \), use the cosine and sine components:
\[
r e^{i\theta} = r(\cos \theta + i \sin \theta) = a + bi.
\]

**Example**

\[
27 e^{i 3\pi/4} = 27\left(\cos \frac{3\pi}{4} + i \sin \frac{3\pi}{4}\right) = 27\left(-\frac{\sqrt{2}}{2} + i \frac{\sqrt{2}}{2}\right) = -\frac{27\sqrt{2}}{2} + i\frac{27\sqrt{2}}{2}.
\]

## 4. Extracting Roots with De Moivre

The \( n \)-th roots of \( z = r e^{i\theta} \) are
\[
z_k = r^{1/n} e^{i(\theta + 2\pi k)/n}, \quad k = 0, 1, \ldots, n - 1.
\]

**Example (cube roots of \( -8 \))**

\[
-8 = 8 e^{i\pi} \quad \Rightarrow \quad \sqrt[3]{-8} = 2 e^{i(\pi + 2\pi k)/3}.
\]

For \( k = 0, 1, 2 \), the roots are \( 2 e^{i\pi/3} \), \( 2 e^{i\pi} \), and \( 2 e^{i 5\pi/3} \).

## 5. Practice Examples

- \( (1 + i)^5 \): Here, \( r = \sqrt{2} \) and \( \theta = \pi/4 \).
  \[
  (1 + i)^5 = (\sqrt{2})^5 e^{i 5\pi/4} = 4\sqrt{2}\,e^{i 5\pi/4} = -4 - 4i.
  \]
- \( \left(2(\cos 30^\circ + i \sin 30^\circ)\right)^4 \):
  \[
  \left(2(\cos 30^\circ + i \sin 30^\circ)\right)^4 = 2^4 e^{i 4 \cdot 30^\circ} = 16 e^{i 120^\circ} = -8 + 8\sqrt{3}\,i.
  \]

## 6. Applying the Workflow Yourself

1. Convert \( a + bi \) to polar form by computing \( r \) and \( \theta \).
2. Apply De Moivre's formula to raise the number to a power or extract roots.
3. Convert the result back to Cartesian coordinates using cosine and sine.

This process streamlines complex exponentiation and root extraction by reducing the problem to arithmetic on the modulus and angle.
