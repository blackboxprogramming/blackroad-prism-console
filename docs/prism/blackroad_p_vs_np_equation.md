# BlackRoad P vs NP Polynomial Note

## Overview

This note captures the BlackRoad framing of the P vs NP question through a pair of quadratic encodings. The constructions use historically significant years to emphasize how close computational verification and solution search might appear when placed on a shared polynomial timeline.

## Cook–Karp Polynomial

We encode the founding era of NP-completeness results in the quadratic

\[
C(x) = 1971x^2 + 1972x - 3943,
\]

where the coefficients reference Cook's 1971 paper, Karp's 1972 follow-up, and the negative sum of the two years. The discriminant is

\[
\Delta_C = 1972^2 - 4 \cdot 1971 \cdot (-3943) = 34{,}975{,}396 = 2^2 \cdot 2{,}957^2,
\]

so the polynomial has two real roots:

\[
 x_{C,\pm} = \frac{-1972 \pm 2 \cdot 2{,}957}{2 \cdot 1971} \approx \{-2.0005, 1.0\}.
\]

These roots straddle the interval $[-2, 1]$, reinforcing the idea that the theoretical separation between exponential exploration and polynomial verification remains unresolved but numerically tight in this encoding.

## Millennium Prize Polynomial

The BlackRoad "Millennium" equation is

\[
P(x) = 2000x^2 + 7x - 2000,
\]

capturing the Millennium Prize announcement year and the seven problems. The discriminant evaluates to

\[
\Delta_P = 7^2 + 4 \cdot 2000^2 = 16{,}000{,}049 = 13 \cdot 257 \cdot 4{,}789,
\]

which is square-free—there is no collapse to a rational perfect square. Consequently the roots remain irrational,

\[
 x_{P,\pm} = \frac{-7 \pm \sqrt{16{,}000{,}049}}{4{,}000} \approx \{-1.00018, 0.99825\},
\]

and sit just outside the $\pm 1$ boundary. Evaluating the polynomial at $x=\pm 1$ reveals the same near-symmetry: $P(1)=7$ while $P(-1)=-7$.

## Canonical Form and Vertex

Completing the square highlights the shared origin emphasized by the BlackRoad narrative:

\[
P(x) = 2000\left(x + \frac{7}{4000}\right)^2 - \frac{16{,}000{,}049}{8{,}000}.
\]

The vertex occurs at $x_v = -\tfrac{7}{4000}$ with value $P(x_v) = -\tfrac{16{,}000{,}049}{8{,}000} \approx -2000.0061$, so translating to canonical coordinates \((X, Y)\) with

\[
X = \sqrt{2000} \left(x + \frac{7}{4000}\right), \qquad Y = y + \frac{16{,}000{,}049}{8{,}000},
\]

restores the parabola $Y = X^2$ with the vertex at the origin. This shift represents the "the problem is the coordinate system" intuition: once the historical bias is removed, the landscape resembles the canonical parabola underpinning classical complexity comparisons.

## Future Directions

The narrative invites several follow-on explorations:

1. **Force the unity root:** Study the implications of constraining $x=1$ (treating $P = NP$ as an axiom) and quantify how much the polynomial structure must change to preserve the discriminant.
2. **Cross-problem encodings:** Construct analogous quadratics for other Millennium Prize problems and examine whether their discriminants share structural motifs.
3. **Gap constant analysis:** Investigate whether the factorization $13 \cdot 257 \cdot 4{,}789$ has thematic meaning for BlackRoad's duality interpretation or if alternative encodings yield more symmetric factors.

These extensions keep the focus on how coordinate transformations can reveal (or obscure) rational structure in complexity-theoretic storytelling.
