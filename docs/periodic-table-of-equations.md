# Periodic Table of Equations

A poster-style synthesis of the 50 equations that interlock mathematics, physics, chemistry, computation, and living systems. Each entry keeps its original numbering so it can be cross-referenced with the source compendium, while the columns arrange the equations by thematic domain.

| **Structure** | **Energy** | **Information** | **Flow** | **Life** |
| --- | --- | --- | --- | --- |
| **1.** $A\mathbf{x} = \mathbf{b}$<br><sub>linear constraint form</sub> | **9.** $F = ma$<br><sub>Newtonian dynamics</sub> | **28.** $H = -\sum p_i \ln p_i$<br><sub>Shannon entropy</sub> | **13.** $\mathbf{E} = -\nabla V - \partial\mathbf{A}/\partial t$<br><sub>electrodynamic field</sub> | **21.** $S = k_B \ln \Omega$<br><sub>Boltzmann counting</sub> |
| **2.** $c_{ij} = \sum_l a_{il}b_{lj}$<br><sub>matrix composition</sub> | **10.** $\delta S = 0$<br><sub>least action</sub> | **29.** $I(X;Y) = \sum p(x,y)\ln \frac{p(x,y)}{p(x)p(y)}$<br><sub>mutual information</sub> | **14.** $\nabla \times \mathbf{B} = \mu_0\mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}$<br><sub>Maxwell-Ampère</sub> | **22.** $F = E - TS$<br><sub>Helmholtz landscape</sub> |
| **3.** $\det(A) = 0$<br><sub>singular boundaries</sub> | **11.** $E = mc^2$<br><sub>mass-energy equivalence</sub> | **30.** $D_{KL}(P\|Q) = \sum P\ln \frac{P}{Q}$<br><sub>relative entropy</sub> | **27.** $\nabla \cdot \mathbf{J} + \partial_t \rho = 0$<br><sub>continuity</sub> | **23.** $dU = TdS - PdV + \mu dN$<br><sub>first law</sub> |
| **4.** $\nabla f(x) = 0$<br><sub>stationary points</sub> | **12.** $\mathbf{F} = -\nabla U$<br><sub>forces from potentials</sub> | **41.** $P(H\mid D) = \frac{P(D\mid H)P(H)}{P(D)}$<br><sub>Bayesian update</sub> | **31.** $i\hbar\partial_t \Psi = \hat{H}\Psi$<br><sub>Schrödinger flow</sub> | **24.** $\Delta G = \Delta H - T\Delta S$<br><sub>chemical equilibrium</sub> |
| **5.** $\Delta f = \nabla \cdot \nabla f$<br><sub>curvature & diffusion</sub> | **15.** $G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}T_{\mu\nu}$<br><sub>Einstein field</sub> | **42.** $\mathcal{L} = -\sum y_i \ln \hat{y}_i$<br><sub>cross-entropy loss</sub> | **33.** $|\Psi|^2 = \rho$<br><sub>Born rule</sub> | **25.** $\langle E \rangle = -\partial_\beta \ln Z$<br><sub>thermal expectation</sub> |
| **6.** $\ddot{x} = -\omega^2 x$<br><sub>harmonic oscillator</sub> | **16.** $T = \frac{\hbar c^3}{8\pi G M k_B}$<br><sub>Hawking temperature</sub> | **43.** $\dot{\theta} = -\nabla_\theta \mathcal{L}(\theta)$<br><sub>gradient descent</sub> | **37.** $U(t) = e^{-iHt/\hbar}$<br><sub>unitary evolution</sub> | **26.** $P_i = \frac{e^{-\beta E_i}}{Z}$<br><sub>canonical weights</sub> |
| **7.** $\int f'(x)\,dx = f(x) + C$<br><sub>fundamental theorem</sub> | **17.** $ds^2 = g_{\mu\nu}dx^\mu dx^\nu$<br><sub>spacetime interval</sub> | **45.** $y = f(Wx + b)$<br><sub>neural layer</sub> | **38.** $\Psi(x+a) = e^{ika}\Psi(x)$<br><sub>Bloch periodicity</sub> | **34.** $[x,p] = i\hbar$<br><sub>quantum structure</sub> |
| **8.** $e^{i\pi} + 1 = 0$<br><sub>Euler identity</sub> | **18.** $\nabla_\mu T^{\mu\nu} = 0$<br><sub>stress-energy conservation</sub> | **46.** $p(x) = \int p(x\mid z)p(z)\,dz$<br><sub>marginalization</sub> | **39.** $\psi_{n+1} + \psi_{n-1} + 2\cos(2\pi n\phi)\psi_n = E\psi_n$<br><sub>Harper equation</sub> | **35.** $\langle A \rangle = \langle \Psi | \hat{A} | \Psi \rangle$<br><sub>observable averages</sub> |
| **32.** $\hat{O}\psi = \lambda\psi$<br><sub>eigenproblem</sub> | **19.** $V = -\frac{GM}{r}$<br><sub>gravitational potential</sub> | **47.** $\sigma(z) = \frac{1}{1+e^{-z}}$<br><sub>logistic activation</sub> | **40.** $i\partial_z E + \tfrac{1}{2}\partial_t^2 E + \gamma|E|^2E = 0$<br><sub>nonlinear optics</sub> | **36.** $\rho = |\Psi\rangle\langle\Psi|$<br><sub>density operator</sub> |
| **49.** $H\psi = E\psi$<br><sub>spectral decomposition</sub> | **20.** $Z = \sum e^{-\beta E_i}$<br><sub>partition function</sub> | **48.** $K(x,x') = \phi(x)^\top \phi(x')$<br><sub>kernel overlap</sub> | **50.** $\nabla \cdot \mathbf{J} + \partial_t \rho = 0$<br><sub>probability flow</sub> | **44.** $\mathcal{F} = \mathbb{E}_q[\ln q(z) - \ln p(x,z)]$<br><sub>free-energy principle</sub> |

## Reading the Poster

* **Columns = Domains.** Structure captures algebraic and geometric invariants; Energy tracks physical action, curvature, and thermodynamics; Information highlights inference and learning; Flow shows wave, field, and transport equations; Life focuses on organization, metabolism, and predictive processing.
* **Rows = Shared motifs.** Each horizontal band juxtaposes equations that echo one another—e.g., Row 3 pairs conservation laws across algebra, relativity, inference, and thermodynamics.
* **Numbers = Canonical indexing.** The bold indices preserve the original ordering so the poster doubles as a table of contents.

## Cross-Domain Grammar

1. **Symmetry → Conservation.** From eigenstructures (1, 32, 49) to stress-energy balance (18) and probability flow (27, 50), symmetries enforce continuity across domains.
2. **Conservation → Optimization.** Action principles (10) and free-energy minimization (44) mirror gradient descent (43) and Bayesian updating (41).
3. **Optimization → Information.** Thermodynamic potentials (22–26) and learning objectives (42, 45–48) encode uncertainty management.
4. **Information → Life.** The free-energy principle (44) links statistical learning to biological regulation, closing the loop between inference and survival.

Print the markdown as-is or export it through your preferred renderer (e.g., [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf)) to produce a high-resolution poster.
