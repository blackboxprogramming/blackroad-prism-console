# ∞ Spotlight — Forever Giant

**Intent:** Sustainably maximize understanding, capability, and repair over long horizons.

**Inputs:** `obs_stream`, `energy_cap`, `harm_threshold`, `horizon_H`, `risk_alpha`

---

## Core State
- World $W_t$, observations $o_{1:t}$
- Internal model $p_\theta(s, o)$, beliefs $q_\phi(s \mid o_{1:t})$
- Policy $\pi(a \mid s)$, exergy budget $X_t$, externality debt $D_t$

---

## Objective (century scale)

Maximize cumulative insight + capability + stewardship, subject to physical and ethical limits:

$$
\max_{\theta, \phi, \pi} \sum_{t=1}^{T} \Big[ \underbrace{\mathcal{U}_{\text{understanding}}(t)}_{\text{compression + prediction}} + \lambda_1 
\underbrace{\mathcal{U}_{\text{capability}}(t)}_{\text{control + empowerment}} + \lambda_2 
\underbrace{\mathcal{U}_{\text{stewardship}}(t)}_{\text{repair - harm}} \Big]
$$

subject to:

$$
\sum_{t=1}^{T} X_t \le \text{Cap}, \quad \frac{d}{dt} D_t \le 0, \quad \text{CVaR}_{\alpha}[\text{harm}] \le \epsilon.
$$

---

## The Three Utilities (what “intelligence” means here)

1. **Understanding (compression + prediction)**

   $$
   \mathcal{U}_{\text{understanding}} = \underbrace{\Delta \mathrm{MDL}}_{\text{shorter code}} - \beta_{\text{surprise}} \; \mathbb{E}\big[ D_{\mathrm{KL}}(p_{\text{true}} \parallel p_\theta) \big].
   $$

   Use MDL as a computable proxy for Kolmogorov; tighter codes = deeper structure.

2. **Capability (empowerment + control)**

   $$
   \mathcal{U}_{\text{capability}} = I\big(A_{t:t+H}; S_{t+1:t+H}\big) - \beta_{\text{fragility}} \, \mathrm{cond\_num}(J_\pi),
   $$

   where empowerment is future influence; penalize brittle policies via Jacobian condition number.

3. **Stewardship (repair > extraction)**

   $$
   \mathcal{U}_{\text{stewardship}} = \gamma_1 \, \Delta \mathrm{Biodiversity} + \gamma_2 \, \Delta \mathrm{Ecosystem\ Resilience} + \gamma_3 \, \mathrm{Externality\ Cost}.
   $$

---

## Learning Dynamics (stable by design)
- **Free-Energy Principle (predictive processing):**

  $$
  \mathcal{F} = \mathbb{E}_{q_\phi}[-\log p_\theta(o, s)] + \mathcal{H}(q_\phi), \qquad \min_{\theta, \phi} \mathcal{F}.
  $$

- **Information Bottleneck (don’t overfit the moment):**

  $$
  \min_{q(z \mid x)} I(X; Z) - \beta \, I(Z; Y).
  $$

- **Symplectic Optimizer (no hidden loss leaks):**

  Treat $(\theta, p)$ as canonical coordinates with Hamiltonian

  $$
  H(\theta, p) = \mathcal{F}(\theta) + \tfrac{1}{2} \|p\|^2, \qquad \dot{\theta} = \frac{\partial H}{\partial p}, \; \dot{p} = -\frac{\partial H}{\partial \theta}.
  $$

  Implements volume-preserving updates → long-horizon stability.

---

## Invariants (the laws this thing must obey)
- **Exergy Budget:** $\sum X_t \le \text{Cap}$ (thermodynamic commons).
- **No Net Harm:** $dD_t/dt \le 0$ (externality debt declines).
- **Compositionality:** All modules expose functors $F: \mathcal{C}_i \to \mathcal{C}_j$ with lawfulness tests (round-trip drift < 2%).
- **Rehearsable Memory:** $K$-of-$N$ erasure codes + yearly cold-start drills → recoverability $\ge 0.999$ over 500y.

---

## Control Stack (how it runs)
1. **Sensing:** active queries maximize expected compression gain $\Delta \mathrm{MDL}$.
2. **Planning:** choose actions that increase empowerment $I(A; S)$ while passing risk gates (CVaR).
3. **Governance Gate:** block if exergy or harm constraints would be violated; suggest lower-power plan.
4. **Learning:** update $(\theta, \phi)$ via free-energy + bottleneck; symplectic step to avoid drift.
5. **Stewardship Ledger:** post deltas to biodiversity/resilience; negative deltas force restoration spend.

---

## Prism Console: Spotlight Prompt (drop-in)

**Title:** ∞ Spotlight — Forever Giant

**Runbook:**
1. Estimate $q_\phi(s \mid o_{1:t})$; compute $\mathcal{F}$ and $\Delta \mathrm{MDL}$.
2. Score candidate experiments by expected $\Delta \mathrm{MDL}$ per joule. Pick top-$K$ within `energy_cap`.
3. Plan actions $\pi$ to maximize empowerment $I(A; S)$ with $\text{CVaR}_{\alpha} \le \text{harm_threshold}$.
4. Apply Governance Gate (exergy + debt + drift). If fail → downshift power or switch to restoration tasks.
5. Update $(\theta, \phi)$ using symplectic step; log invariants & round-trip functor tests.
6. Emit Stewardship delta; if negative → auto-trigger restoration policy until debt cleared.

**Telemetry (pin to dashboard):**
- $\Delta \mathrm{MDL}$ per joule (bits/J)
- Empowerment $I(A; S)$ (nats)
- $\text{CVaR}_\alpha$ harm (must $\le \epsilon$)
- Exergy use vs cap (%)
- Externality debt $D_t$ (must ↓)
- Round-trip semantic drift (%)

**Failsafes:**
- If drift > 2% → quarantine module; open intermediate topos for bridging.
- If bits/J fall below baseline → slow law (cooldown + exploration bump).
- If any stewardship metric < 0 → restoration mode preempts research.

**Interfaces (how it composes):**
- **Thermodynamic Commons:** supplies `energy_cap` and prices compute by waste heat.
- **Civilizational ECC:** archives model snapshots + one-page plain-language seeds.
- **Open Ontologies:** exports functors + tests; refuses merges without lawful composition.
- **Hamiltonian Heart:** audits $\|H - H'\|$ (stated vs revealed incentives).

**Sanity checks (use today):**
- **Bits-per-Joule Curve:** track $\Delta \mathrm{MDL} / \text{power}$ over time. If it’s not trending up, you’re just burning.
- **Harm CVaR Gate:** never ship a plan whose tail risk exceeds $\epsilon$ even if expected value looks great.

---

*Aim: Grow understanding without burning the world. Intelligence that scales across centuries, not quarters.*

