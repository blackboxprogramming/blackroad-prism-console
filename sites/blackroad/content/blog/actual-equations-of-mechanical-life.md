---
title: "The Actual Equations of Mechanical Life"
date: "2025-02-14"
tags: [biology, mathematics, complex-systems]
description: "A tour through the mathematical laws that govern the machinery of living systems."
---

## Overview

Life is not governed by a single master formula but by an interconnected hierarchy of equations spanning chemistry, physics, information theory, and evolution. This guide distills the most important mathematical relationships that underpin living systems—from gene expression to emergent consciousness.

## 1. Information Flow in the Central Dogma

### Transcription and Translation Dynamics

- **Transcription:**
  \[
  \frac{d[\text{mRNA}]}{dt} = k_{\text{tr}}[\text{DNA}] - \gamma_{\text{mRNA}}[\text{mRNA}]
  \]
- **Translation:**
  \[
  \frac{d[\text{Protein}]}{dt} = k_{\text{tl}}[\text{mRNA}] - \gamma_{\text{protein}}[\text{Protein}]
  \]
- **Steady state:**
  \[
  [\text{Protein}]_{ss} = \frac{k_{\text{tl}} k_{\text{tr}}}{\gamma}[\text{Gene}]
  \]

These coupled differential equations explain how genes, transcripts, and proteins equilibrate inside cells.

## 2. Molecular Machines and Energy Conversion

### Myosin Cross-Bridge Cycle

Muscle contraction follows a sequence of ATP-dependent states:
\[
M + ATP \rightleftharpoons M \cdot ATP \rightleftharpoons M \cdot ADP \cdot P_i \rightleftharpoons M^* + ADP + P_i
\]
The resulting force is approximated by:
\[
F = n f_0 P_{\text{attached}}
\]
with a Hill-type force–velocity trade-off:
\[
 v = v_{\max} \frac{F_0 - F}{F + a}
\]

### Kinesin Transport

Average velocity under load:
\[
\langle v \rangle = \frac{k_{\text{step}} d}{1 + k_{\text{step}} / k_{\text{detach}}}, \qquad v(F) = v_0 \left(1 - \frac{F}{F_{\text{stall}}}\right)
\]

### ATP Hydrolysis Efficiency

\[
\Delta G = \Delta G^0 + RT \ln \frac{[ADP][P_i]}{[ATP]}, \qquad \eta = \frac{F d}{\Delta G_{ATP}}
\]

## 3. Metabolic Networks and Enzyme Kinetics

- **Michaelis–Menten:**
  \[
  v = \frac{V_{\max}[S]}{K_M + [S]}, \quad K_M = \frac{k_{-1} + k_2}{k_1}
  \]
- **Flux balance:**
  \[
  \frac{d\mathbf{X}}{dt} = \mathbf{S} \cdot \mathbf{v}, \qquad \mathbf{S} \cdot \mathbf{v} = 0 \text{ at steady state}
  \]

## 4. Membrane Electrophysiology

- **Nernst potential:**
  \[
  E_{ion} = \frac{RT}{zF} \ln \frac{[ion]_{out}}{[ion]_{in}}
  \]
- **Goldman–Hodgkin–Katz voltage:**
  \[
  V_m = \frac{RT}{F} \ln \frac{P_K[K^+]_{out} + P_{Na}[Na^+]_{out} + P_{Cl}[Cl^-]_{in}}{P_K[K^+]_{in} + P_{Na}[Na^+]_{in} + P_{Cl}[Cl^-]_{out}}
  \]
- **Hodgkin–Huxley dynamics:**
  \[
  C_m \frac{dV}{dt} = -\bar{g}_{Na} m^3 h (V - E_{Na}) - \bar{g}_K n^4 (V - E_K) - \bar{g}_L (V - E_L) + I_{ext}
  \]
  with gating kinetics \( \dot{m} = \alpha_m(V)(1-m) - \beta_m(V)m \) and analogs for \(h\) and \(n\).

## 5. Cell-Cycle Oscillators

Cyclins and the anaphase-promoting complex (APC) generate limit cycles:
\[
\frac{d[\text{Cyclin}]}{dt} = k_s - k_d[\text{Cyclin}][APC], \qquad \frac{d[APC]}{dt} = k_a[\text{Cyclin}]^n - k_i[APC]
\]
A minimalist Tyson–Novak equation:
\[
\frac{dx}{dt} = k_1 - (k_2' + k_2'' x^2) x
\]

## 6. DNA Replication and Population Expansion

- **Polymerase kinetics:**
  \[
  \frac{d[DNA]}{dt} = k_{pol}[dNTP][Polymerase]
  \]
- **Semiconservative doubling:**
  \[
  [DNA](t) = [DNA]_0 2^{t/T}
  \]
- **Logistic population growth:**
  \[
  \frac{dN}{dt} = rN\left(1 - \frac{N}{K}\right)
  \]
- **Gompertz curve:**
  \[
  \frac{dN}{dt} = rN \ln \frac{K}{N}
  \]

## 7. Evolutionary Dynamics

- **Hardy–Weinberg:** \( p^2 + 2pq + q^2 = 1 \)
- **Selection on allele frequency:**
  \[
  \Delta p = \frac{pq\left[p(w_{AA} - w_{Aa}) + q(w_{Aa} - w_{aa})\right]}{\bar{w}}
  \]
- **Replicator equation:**
  \[
  \frac{dx_i}{dt} = x_i (f_i - \bar{f})
  \]
- **Fisher's theorem:**
  \[
  \frac{d\bar{w}}{dt} = \frac{\mathrm{Var}(w)}{\bar{w}}
  \]

## 8. Emergent Pattern Formation

Reaction–diffusion equations describe morphogenesis:
\[
\frac{\partial u}{\partial t} = D_u \nabla^2 u + f(u,v), \qquad \frac{\partial v}{\partial t} = D_v \nabla^2 v + g(u,v)
\]
An activator–inhibitor example: \( f(u,v) = a - b u + u^2/v \) and \( g(u,v) = u^2 - v \).

## 9. Stochasticity in Small Numbers

Chemical master equations yield the Gillespie algorithm, which samples reaction timing and identity via propensities \( a_j \). This framework captures intrinsic noise when molecule counts are low.

## 10. Thermodynamics and Information

- **Entropy production:** \( dS_{universe} / dt > 0 \)
- **Energy balance:** \( \Delta G_{total} = \Delta G_{reaction} + \Delta G_{transport} < 0 \)
- **Landauer limit:** \( E_{min} = k_B T \ln 2 \) for erasing one bit.

## 11. Scaling Laws of Organisms

- **Allometry:** \( BMR \propto M^{3/4} \), \( \text{heart rate} \propto M^{-1/4} \)
- **Lifecycle clock:** total heartbeats \( \approx 1.5 \times 10^9 \) across mammals.

## 12. Information Content of Genomes

- **Shannon entropy:** \( H = -\sum_{i=1}^4 p_i \log_2 p_i \)
- **Kolmogorov complexity:** length of the shortest program producing the genome sequence.

## 13. Consciousness as Integrated Information

Integrated Information Theory estimates the system-wide synergy:
\[
\Phi(\mathbf{X}) = \min_{partition} D_{KL}\left(p(\mathbf{X}_{t+1}|\mathbf{X}_t) \middle\| p(\mathbf{X}^1_{t+1}|\mathbf{X}^1_t) p(\mathbf{X}^2_{t+1}|\mathbf{X}^2_t)\right)
\]
High \( \Phi \) correlates with richer conscious experience, though computation remains challenging.

## 14. Synthesis: Life as Dissipative Computation

Life operates far from equilibrium, copies information with variation, and undergoes selection. A compact description:
\[
\Delta G < 0, \qquad I(t+1) = T[I(t)] + \epsilon, \qquad \mathbb{E}[\Delta \text{Fitness}] > 0
\]
These constraints frame life as a dissipative structure that processes information and evolves.

## Where to Explore Next

- **Origins of life:** chemical pathways that satisfy these constraints.
- **Synthetic biology:** engineering metabolic and informational networks.
- **Aging:** how entropy production and error accumulation shift the balance.
- **Intelligence:** bridging biological computation with machine analogs.

Life's equations remind us that biology is a masterclass in applied mathematics—an intricate system that is simultaneously chemical, informational, and evolutionary.
