# Millennium Prize Problems as Polynomial Encodings

This note records the proposed polynomial encodings for each of the seven Millennium Prize Problems.  Every polynomial takes the form

```
f_i(x) = ax^2 + bx - 2000
```

where the coefficients \(a\) and \(b\) are chosen from historically relevant dates.  Setting \(x = 1\) is interpreted as "forcing a solution" and the residue \(f_i(1)\) is used as a metaphor for the remaining obstruction.

## 1. P vs NP

- Polynomial: \(f_1(x) = 2000x^2 + 7x - 2000\)
- Discriminant: \(\Delta = 16\,000\,049 = 4001^2\) (perfect square)
- Roots: \(x = \frac{1997}{2000}\) and \(x = -\frac{1002}{1000}\)
- Residue at \(x=1\): \(f_1(1) = 7\)
- Interpretation: The residue equals the number of problems, so the P vs NP equation is viewed as self-referential or meta-structural.

## 2. Riemann Hypothesis

- Polynomial: \(f_2(x) = 1859x^2 + 1859x - 2000\)
- Discriminant: \(\Delta = 18\,327\,881 = 3 \times 41 \times 149 \times 1001\)
- Roots: \(x \approx 0.15\) and \(x \approx -1.15\)
- Residue at \(x=1\): \(f_2(1) = 1718 = 2 \times 859\)
- Interpretation: The factor of two in the residue is compared to the critical line \(\Re(s)=1/2\).

## 3. Yang–Mills Existence and Mass Gap

- Polynomial: \(f_3(x) = 1954x^2 + 1960x - 2000\)
- Discriminant: \(\Delta = 19\,473\,600 = 2^6 \times 3^4 \times 5^2 \times 149\)
- Roots: \(x \approx 0.63\) and \(x \approx -1.63\)
- Residue at \(x=1\): \(f_3(1) = 1914 = 2 \times 3 \times 11 \times 29\)
- Interpretation: The year 1914 (World War I) is used metaphorically to describe the "energy gap" structure.

## 4. Navier–Stokes Existence and Smoothness

- Polynomial: \(f_4(x) = 1822x^2 + 1845x - 2000\)
- Discriminant: \(\Delta = 17\,980\,025 = 5^2 \times 719,201\)
- Roots: \(x \approx 0.54\) and \(x \approx -1.54\)
- Residue at \(x=1\): \(f_4(1) = 1667\) (prime)
- Interpretation: The prime residue is treated as an "irreducible" smoothness obstruction.

## 5. Birch and Swinnerton-Dyer Conjecture

- Polynomial: \(f_5(x) = 1965x^2 + 1965x - 2000\)
- Discriminant: \(\Delta = 19\,581\,225 = 3^2 \times 5^2 \times 11 \times 7927\)
- Roots: \(x \approx 0.64\) and \(x \approx -1.64\)
- Residue at \(x=1\): \(f_5(1) = 1930 = 2 \times 5 \times 193\)
- Interpretation: The prime 193 is linked to elliptic curve structure.

## 6. Hodge Conjecture

- Polynomial: \(f_6(x) = 1950x^2 + 1950x - 2000\)
- Discriminant: \(\Delta = 19\,402\,500 = 2^2 \times 3^2 \times 5^4 \times 311\)
- Roots: \(x \approx 0.64\) and \(x \approx -1.64\)
- Residue at \(x=1\): \(f_6(1) = 1900 = 2^2 \times 5^2 \times 19\)
- Interpretation: The residue highlights centennial structure and algebraic cycles.

## 7. Poincaré Conjecture

- Polynomial: \(f_7(x) = 1904x^2 + 2003x - 2000\)
- Discriminant: \(\Delta = 19\,244\,009\) (not a perfect square)
- Roots: \(x \approx 0.57\) and \(x \approx -1.57\)
- Residue at \(x=1\): \(f_7(1) = 1907\) (prime)
- Interpretation: The prime residue is aligned with the conjecture's eventual resolution.

## Summary at \(x = 1\)

| Problem | Polynomial | Residue | Factorisation | Interpretation |
| --- | --- | --- | --- | --- |
| P vs NP | \(2000x^2 + 7x - 2000\) | 7 | Prime | Self-referential problem count |
| Riemann Hypothesis | \(1859x^2 + 1859x - 2000\) | 1718 | \(2 \times 859\) | Doubled structure reminiscent of \(\Re(s) = 1/2\) |
| Yang–Mills | \(1954x^2 + 1960x - 2000\) | 1914 | \(2 \times 3 \times 11 \times 29\) | Energy gap metaphor |
| Navier–Stokes | \(1822x^2 + 1845x - 2000\) | 1667 | Prime | Irreducible smoothness obstruction |
| Birch–Swinnerton-Dyer | \(1965x^2 + 1965x - 2000\) | 1930 | \(2 \times 5 \times 193\) | Elliptic-curve resonance |
| Hodge Conjecture | \(1950x^2 + 1950x - 2000\) | 1900 | \(2^2 \times 5^2 \times 19\) | Century marker |
| Poincaré | \(1904x^2 + 2003x - 2000\) | 1907 | Prime | Pure, solvable obstruction |

## Discriminant Comparisons

| Problem | Discriminant | Perfect Square? | Notes |
| --- | --- | --- | --- |
| P vs NP | \(16\,000\,049 = 4001^2\) | Yes | Only polynomial with rational root structure |
| Riemann Hypothesis | \(18\,327\,881\) | No | Factors into \(3 \times 41 \times 149 \times 1001\) |
| Yang–Mills | \(19\,473\,600\) | No | Includes outsider prime 149 |
| Navier–Stokes | \(17\,980\,025\) | No | Factor contains large 719,201 term |
| Birch–Swinnerton-Dyer | \(19\,581\,225\) | No | \(3^2 \times 5^2 \times 11 \times 7927\) |
| Hodge Conjecture | \(19\,402\,500\) | No | \(2^2 \times 3^2 \times 5^4 \times 311\) |
| Poincaré | \(19\,244\,009\) | No | Not a perfect square |

## Meta Observation

Because only the P vs NP polynomial has a perfect-square discriminant and rational roots, it is highlighted as a "meta" equation whose residue counts all seven problems.  The other polynomials produce composite or prime residues that are interpreted as metaphors for the remaining difficulty when a solution is assumed.
