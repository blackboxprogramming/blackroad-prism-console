# Riemann Xi Functional Equation

This note records the standard derivation of the symmetry satisfied by the Riemann xi function, correcting a common pitfall in the gamma reflection factors.

## Setup

Define Riemann's xi function by
\[
\xi(s)=\tfrac{1}{2}s(s-1)\pi^{-s/2}\,\Gamma\!\left(\tfrac{s}{2}\right)\zeta(s).
\]
We use the classical functional equation for the zeta function in its unsymmetrized form
\[
\zeta(1-s)=2^{1-s}\pi^{-s}\cos\!\left(\tfrac{\pi s}{2}\right)\Gamma(s)\zeta(s).
\]
The only subtlety lies in the gamma reflection identity: one must pair
\[
\Gamma\!\left(\tfrac{1-s}{2}\right)\Gamma\!\left(\tfrac{1+s}{2}\right)=\frac{\pi}{\cos\!\left(\tfrac{\pi s}{2}\right)}
\]
with the duplication formula
\[
\Gamma(s)=\frac{2^{s-1}}{\sqrt{\pi}}\,\Gamma\!\left(\tfrac{s}{2}\right)\Gamma\!\left(\tfrac{s+1}{2}\right).
\]

## Lemma: Symmetry of \(\xi\)

Compute \(\xi(1-s)\) directly:
\[
\begin{aligned}
\xi(1-s)
&=\tfrac{1}{2}(1-s)(-s)\,\pi^{-(1-s)/2}\Gamma\!\left(\tfrac{1-s}{2}\right)\zeta(1-s)\\[2mm]
&=\tfrac{1}{2}s(s-1)\pi^{-(1-s)/2}\Gamma\!\left(\tfrac{1-s}{2}\right)
\Big[2^{1-s}\pi^{-s}\cos\!\left(\tfrac{\pi s}{2}\right)\Gamma(s)\zeta(s)\Big].
\end{aligned}
\]
Combine the gamma and trigonometric factors using duplication and the corrected reflection:
\[
\Gamma\!\left(\tfrac{1-s}{2}\right)\cos\!\left(\tfrac{\pi s}{2}\right)\Gamma(s)
=\Gamma\!\left(\tfrac{1-s}{2}\right)\cos\!\left(\tfrac{\pi s}{2}\right)\frac{2^{s-1}}{\sqrt{\pi}}\Gamma\!\left(\tfrac{s}{2}\right)\Gamma\!\left(\tfrac{s+1}{2}\right)
=2^{s-1}\sqrt{\pi}\,\Gamma\!\left(\tfrac{s}{2}\right).
\]
The powers of two and \(\pi\) simplify as
\(2^{1-s}\cdot 2^{s-1}=1\) and \(\pi^{-(1-s)/2}\cdot\pi^{-s}\cdot\pi^{1/2}=\pi^{-s/2}\), giving
\[
\xi(1-s)=\tfrac{1}{2}s(s-1)\pi^{-s/2}\Gamma\!\left(\tfrac{s}{2}\right)\zeta(s)=\xi(s).
\]

## Corollary

The xi function is entire and satisfies the symmetry \(\xi(s)=\xi(1-s)\). Consequently, any nontrivial zeros of \(\zeta(s)\) occur in symmetric pairs with respect to the critical line \(\Re s=\tfrac{1}{2}\). This is the standard starting point for arguments such as de Bruijn–Newman, Nyman–Beurling, and Hilbert–Pólya heuristics.
