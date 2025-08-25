# Trinary Logic Specification

## Introduction
Prism uses a trinary logic system where each proposition takes one of three values:

- **-1** – false
- **0** – neutral/unknown
- **1** – true

These values form an ordered set \(-1 < 0 < 1\) enabling graded reasoning and stable handling of uncertainty.

## Truth Tables
The tables below define the core logical operators. Rows correspond to the first operand \(a\); columns correspond to the second operand \(b\).

### AND
| a  | b  | a ∧ b |
|---:|---:|------:|
| -1 | -1 | -1 |
| -1 |  0 | -1 |
| -1 |  1 | -1 |
|  0 | -1 | -1 |
|  0 |  0 |  0 |
|  0 |  1 |  0 |
|  1 | -1 | -1 |
|  1 |  0 |  0 |
|  1 |  1 |  1 |

### OR
| a  | b  | a ∨ b |
|---:|---:|------:|
| -1 | -1 | -1 |
| -1 |  0 |  0 |
| -1 |  1 |  1 |
|  0 | -1 |  0 |
|  0 |  0 |  0 |
|  0 |  1 |  1 |
|  1 | -1 |  1 |
|  1 |  0 |  1 |
|  1 |  1 |  1 |

### NOT
| a  | ¬a |
|---:|---:|
| -1 |  1 |
|  0 |  0 |
|  1 | -1 |

### XOR
The exclusive OR returns the non‑neutral value when exactly one operand is non‑neutral, and returns **1** when both operands are non‑neutral and different.

| a  | b  | a ⊕ b |
|---:|---:|------:|
| -1 | -1 |  0 |
| -1 |  0 | -1 |
| -1 |  1 |  1 |
|  0 | -1 | -1 |
|  0 |  0 |  0 |
|  0 |  1 |  1 |
|  1 | -1 |  1 |
|  1 |  0 |  1 |
|  1 |  1 |  0 |

## Transition Matrices
Trinary states are represented as basis vectors
\(e_{-1} = [1,0,0]^T\), \(e_{0} = [0,1,0]^T\), \(e_{1} = [0,0,1]^T\).
Operators act via matrix multiplication on these vectors.

### NOT
\[
M_{\neg} = \begin{bmatrix}
0 & 0 & 1\\
0 & 1 & 0\\
1 & 0 & 0
\end{bmatrix}
\]

### AND
\[
M_{\land} = \begin{bmatrix}
-1 & -1 & -1\\
-1 & 0 & 0\\
-1 & 0 & 1
\end{bmatrix}
\]

### OR
\[
M_{\lor} = \begin{bmatrix}
-1 & 0 & 1\\
0 & 0 & 1\\
1 & 1 & 1
\end{bmatrix}
\]

### XOR
\[
M_{\oplus} = \begin{bmatrix}
0 & -1 & 1\\
-1 & 0 & 1\\
1 & 1 & 0
\end{bmatrix}
\]

## FFT Mapping
Trinary values can be embedded in frequency space using a discrete Fourier transform (DFT). For a state vector
\(v = [v_{-1}, v_{0}, v_{1}]^T\), the frequency representation is
\(\hat{v} = Fv\) where
\[
F = \frac{1}{\sqrt{3}}\begin{bmatrix}
1 & 1 & 1\\
1 & \omega & \omega^2\\
1 & \omega^2 & \omega^4
\end{bmatrix}, \quad \omega = e^{-2\pi i/3}.
\]
Here, **1** corresponds to a sine wave in phase, **-1** to a sine wave 180° out of phase, and **0** to zero amplitude. This mapping links logical states to harmonic analysis for algorithms inspired by the sine‑wave Codex.

## Examples
### Paradox Resolution
A statement and its negation can coexist: with \(a=1\) and \(\neg a=-1\), applying XOR yields
\(a \oplus (\neg a) = 1\), highlighting the conflict, while averaging them produces the neutral state, assisting paradox management.

### Neutral State Handling
Sensor inputs often produce an undecided value. Using AND and OR with 0 allows the system to propagate uncertainty without collapsing to true or false, e.g. \(0 \land 1 = 0\) preserves doubt, while \(0 \lor 1 = 1\) allows optimistic defaults.
