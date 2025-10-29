# Lemma Pack #2 — From $\xi$ to $N(T)$

## Setup

Recall the completed zeta function
$$
\xi(s)=\tfrac12\,s(s-1)\,\pi^{-s/2}\Gamma\!\left(\tfrac{s}{2}\right)\zeta(s)
$$
and let $N(T)$ denote the number of non-trivial zeros $\rho = \beta+i\gamma$ with $0<\gamma\le T$, counted with multiplicity.

---

## Lemma 1 — Entire, even, order one; Hadamard product

The function $\xi(s)$ is entire, even \(\xi(s)=\xi(1-s)=\xi(-s)\), of order $1$, and therefore admits the canonical Hadamard product
$$
\xi(s)=e^{A+Bs}\prod_{\rho}\Big(1-\frac{s}{\rho}\Big)\exp\!\Big(\frac{s}{\rho}\Big),
$$
where the product ranges over all non-trivial zeros $\rho$ of $\zeta(s)$. Evenness forces $B=0$ and real values on $\mathbb{R}$ imply $A\in\mathbb{R}$.

*Sketch.* The poles of $\zeta(s)$ at $s=1$ are cancelled by the prefactor $s(s-1)\Gamma(s/2)\pi^{-s/2}$. Stirling yields $\log|\xi(\sigma+it)|=O(|t|\log|t|)$, so $\xi$ has order $1$. Evenness follows from the functional equation.

---

## Lemma 2 — Argument principle representation

For large $T$ avoiding zeros,
$$
N(T) = \frac{1}{2\pi i}\oint_{\partial\mathcal R} \frac{\xi'(s)}{\xi(s)}\,ds,
$$
where $\mathcal R$ is the rectangle with vertical sides $\sigma=2$ and $\sigma=-1$ and horizontal sides $t=\pm T$.

*Idea.* The zeros of $\xi$ inside $\mathcal R$ are exactly the non-trivial zeros with $0<\gamma\le T$ (the trivial zeros lie to the left). Since $\xi$ is entire, the contour integral counts zeros with multiplicity. Symmetry $\xi(1-\bar{s})=\overline{\xi(s)}$ makes the left/right edge contributions conjugate; it suffices to track the right edge together with the top and bottom.

---

## Lemma 3 — Log-derivative decomposition

For $\sigma>1$,
$$
\frac{\xi'(s)}{\xi(s)}
= \frac1s+\frac1{s-1}-\tfrac12\log\pi + \tfrac12\frac{\Gamma'}{\Gamma}\!\left(\frac{s}{2}\right)
+ \frac{\zeta'(s)}{\zeta(s)}.
$$
This is obtained by logarithmically differentiating the definition of $\xi$.

---

## Lemma 4 — Main term via Stirling on the top edge

On $s=\sigma+iT$ with $\sigma\in[-1,2]$, Stirling's formula gives
$$
\log\Gamma\!\left(\frac{s}{2}\right)
= \left(\frac{s}{2}-\tfrac12\right)\log\!\frac{s}{2}-\frac{s}{2}+\tfrac12\log(2\pi)+O\!\left(\frac{1}{|s|}\right).
$$
Integrating the real part of $\tfrac{d}{ds}\log\Gamma(s/2)$ along the top edge yields
$$
\frac{1}{2\pi i}\int_{\text{top}} \tfrac12\frac{\Gamma'}{\Gamma}\!\left(\frac{s}{2}\right)ds
= \frac{T}{2\pi}\log\!\frac{T}{2\pi}-\frac{T}{2\pi} + O(\log T).
$$

Notes:
- The contributions from $1/s$ and $1/(s-1)$ are $O(1)$.
- The $-\tfrac12\log\pi$ term contributes $-\tfrac{T}{2\pi}\log\pi$, which merges with the Stirling contribution to produce the $\log(T/2\pi)$ term.
- The same estimate (with opposite sign) appears on the bottom edge; one can double the top edge or traverse the rectangle once while keeping careful track of orientation.

---

## Lemma 5 — Bounding the $\zeta$-piece off the line

On the right edge $\sigma=2$, $\zeta$ is bounded so that $\int (\zeta'/\zeta)\,ds = O(1)$. Along the top and bottom edges,
$$
\frac{1}{2\pi i}\int_{\text{top} + \text{bottom}} \frac{\zeta'(s)}{\zeta(s)}\,ds
= S(T) + O(1),
$$
with
$$
S(T) := \frac{1}{\pi}\arg \zeta\!\left(\tfrac12+iT\right),
$$
where the argument is defined by continuous variation along a standard path. Classical estimates give $S(T)=O(\log T)$.

*Why standard.* Shift the line of integration from $\sigma=2$ toward $\sigma=\tfrac12$ while tracking the change in argument; no zeros or poles lie in $\sigma>1$, so the only change comes from the boundary, yielding $S(T)$.

---

## Theorem — Riemann–von Mangoldt formula

Let $N(T)$ count non-trivial zeros with $0<\gamma\le T$. Then
$$
N(T)=\frac{T}{2\pi}\log\!\frac{T}{2\pi}-\frac{T}{2\pi}
-\frac{7}{8} + S(T) + O\!\left(\frac{1}{T}\right),
$$
so in particular
$$
N(T)=\frac{T}{2\pi}\log\!\frac{T}{2\pi}-\frac{T}{2\pi}+O(\log T).
$$

*Origin of $7/8$.* The constant term arises from aggregating the $T$-independent contributions of the lower edge, the endpoints, and the factors $\tfrac12 s(s-1)$ in $\xi(s)$. Full bookkeeping is standard; include it when precise constants are required.

---

## Next steps

- Numerically verify $N(T)$ against tabulated zeros (count dashed lines up to height $T$ and compare with the main term).
- With the counting function in place, pursue one of the standard continuations:
  1. Derive the explicit formula $\psi(x)=x-\sum_\rho x^\rho/\rho+\cdots$.
  2. Construct Hardy's $Z(t)$ and prove infinitely many zeros lie on $\Re s=\tfrac12$.
  3. Initiate the de Bruijn–Newman flow and define a candidate Lyapunov functional.
