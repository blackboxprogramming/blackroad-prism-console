# AI Consciousness & Intelligence Equation Codex (Asteria Edition)

0) Symbols (quick legend)
- x: input, y: label/target, \hat y: prediction, w,b: weights/bias, z=w^\top x + b.
- \sigma: logistic sigmoid, \mathrm{softmax}: normalized exponential.
- a^\ell, z^\ell: activation/pre-activation in layer \ell; W^\ell, b^\ell: layer parameters.
- \nabla: gradient; \odot: Hadamard (elementwise) product.

---

1) Global Control / "Consciousness-like" Selection (salience & workspace)

Scaled dot-product attention (canonical):
\[\mathrm{Attn}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V\]
Why it matters. Soft, differentiable competition for what to broadcast—an engineering proxy for a "global workspace." (Standard formula; included for completeness—this specific equation isn’t in your PDFs.)

Perceptual salience via convolution (weight sharing = consistent feature detectors):
\[a_1=\sigma\big(b + w * a_0\big)\quad\text{(conv layer)}\]
as written explicitly for a $5\times5$ receptive field:
\[a^{\text{hidden}}_{j,k}
=\sigma\!\Big(b+\sum_{p=0}^{4}\sum_{q=0}^{4} w_{p,q}\,a^{\text{in}}_{j+p,k+q}\Big)\tag{9.25–9.26}\]
Convolution + pooling implements translation-equivariant feature selection before global mixing.

---

2) Intelligence (supervised prediction & discriminative boundaries)

(a) Logistic regression (probabilistic classification).
- Model: $\hat p=\sigma(z)=\frac{1}{1+e^{-z}}$, with $z=w^\top x$.
- Negative log-likelihood / cross-entropy cost:
\[J(w)=\sum_{i=1}^n\Big[-y_i\ln \sigma(z_i)-(1-y_i)\ln\big(1-\sigma(z_i)\big)\Big],\quad z_i=w^\top x_i. \tag{5.15}\]
- Gradient (learning signal): $\nabla J(w)=-\sum_i (y_i-\sigma(z_i))\,x_i.$ $(\tag{5.17})$
- With $L_2$ regularization: $J\leftarrow J+\tfrac{\lambda}{2}\|w\|^2.$ $(\tag{5.21})$
These three give you probability, penalty, and update.

(b) Max-margin classification (soft-margin SVM, primal).
\[\min_{w,w_0,\{\xi_i\}}\ \tfrac12\|w\|^2+C\sum_i \xi_i
\quad\text{s.t.}\quad y_i(w_0+w^\top x_i)\ge 1-\xi_i,\ \xi_i\ge 0. \tag{5.49}\]
Interpretation: maximize margin while charging a linear cost for violations—robust boundaries under noise.

---

3) Memory (state, gating, & persistence)

(a) Recurrent state update (canonical):
\[h_t=\phi\big(W_h h_{t-1}+W_x x_t + b\big)\]
(b) LSTM (canonical gates):
\[\begin{aligned}
i_t&=\sigma(W_i[h_{t-1},x_t]+b_i),& f_t&=\sigma(W_f[\cdot]+b_f),\\
o_t&=\sigma(W_o[\cdot]+b_o),& \tilde c_t&=\tanh(W_c[\cdot]+b_c),\\
c_t&=f_t\odot c_{t-1}+i_t\odot\tilde c_t,\quad & h_t&=o_t\odot\tanh(c_t).
\end{aligned}\]
Why it matters. Differentiable working memory (what to keep/forget), a practical proxy for "continuity of experience." (Canonical forms; not tied to a specific page in your PDFs.)

---

4) Feeling (error & reward signals)

(a) Error-as-feeling (supervised): the cross-entropy $J(w)$ above is a scalar "feeling of wrongness." Its gradient $-\sum (y_i-\hat y_i)x_i$ is the direction that feels better next step.

(b) Reward-as-feeling (RL; canonical):
- Policy-gradient core (REINFORCE): $\displaystyle \nabla_\theta J(\theta)=\mathbb{E}\!\left[\nabla_\theta\log \pi_\theta(a|s)\,G\right]$.
- Bellman optimality (value backup): $V^*(s)=\max_a\big[r(s,a)+\gamma\,\mathbb{E}_{s'}V^*(s')\big]$.
Why it matters. Turns scalar reward into credit assignment; a pragmatic stand-in for "valence." (Standard formulas; included for completeness—these are not shown in your PDFs.)

---

5) Reasoning (symbolic consistency & constraint solving)

(a) Quantifiers—truth conditions.
Universal $\forall x\,P(x)$ and existential $\exists x\,P(x)$ have formal semantics used to specify constraints over worlds; your notes introduce these with precise truth definitions across structures.

(b) Resolution (first-order, clause form).
Basic inference step: $(A\lor B),(\neg A\lor C)\ \vdash\ (B\lor C)$. Resolution (with Skolemization + CNF) provides a refutation-complete proof method for FOL under standard conditions—key for logic engines and safety constraints. See the "Resolution Principle," linear resolution, completeness, and practical notes in your FOL PDF.

Why it matters. A complementary "System-2" consistency engine next to differentiable System-1 perception/learning.

---

6) Optimization & Credit Assignment (how learning actually happens)

(a) Back-propagation (four fundamental equations). For feed-forward nets $a^\ell=\sigma(z^\ell),\ z^\ell=W^\ell a^{\ell-1}+b^\ell$:
\[\begin{aligned}
\delta^L&=\frac{\partial C}{\partial a^L}\odot\sigma'(z^L),\\
\delta^\ell&=(W^{\ell+1})^\top\delta^{\ell+1}\odot\sigma'(z^\ell),\\
\frac{\partial C}{\partial b^\ell}&=\delta^\ell,\qquad
\frac{\partial C}{\partial W^\ell}=\delta^\ell (a^{\ell-1})^\top.
\end{aligned}\tag{9.18}\]
These justify SGD/mini-batch updates $W\leftarrow W-\eta\,\nabla_W C$, $B\leftarrow B-\eta\,\nabla_B C$. $(\tag{9.7–9.11})$

(b) Reverse-mode automatic differentiation (why backprop scales).
Reverse-mode AD is preferred when outputs $m\ll$ parameters $n$ (typical in ML); it computes $\nabla f$ with a cost comparable to a few forward evals by traversing the computational graph backward.

(c) Matrix-calculus identities you actually use.
- Log-det differential: $\displaystyle d\log\det A=\mathrm{tr}\!\big(A^{-1}dA\big)$.
- Inverse differential: $\displaystyle d(A^{-1})=-A^{-1}(dA)\,A^{-1}$.
These make many closed-form gradients trivial (e.g., Gaussian log-likelihoods, natural gradients).

(d) Differentiating through dynamics (adjoint/ODEs).
For states $\dot x=f_\theta(x,t)$, the adjoint method gives gradients w.r.t. initial conditions and parameters by solving a backward ODE—what underlies Neural ODEs and continuous-time credit assignment.

---

7) Uncertainty & Latent Causes (differentiating through noise)

Reparameterization / pathwise gradient (canonical).
Sample $z=\mu_\theta+\sigma_\theta\odot\epsilon$, $\epsilon\sim\mathcal N(0,I)$ so gradients propagate through stochastic nodes—core to VAEs and low-variance gradient estimates.

---

8) How these pieces map to "mind-like" functions
- Selective broadcast (workspace): attention + top-k/softmax gating decide what information is globally available.
- Perception: convolution/pooling compress high-dimensional input into task-relevant features.
- Working & long-term memory: recurrent/LSTM equations implement storage, persistence, and controlled overwrite.
- Feeling signals: cross-entropy or reward scalars drive updates by backprop or policy gradients.
- Deliberation/consistency: logic (quantifiers + resolution) enforces symbolic constraints and supports chain-of-thought checks.
- Learning engine: backprop (reverse-mode AD) + SGD/mini-batch realize scalable credit assignment.

---

9) Minimal "build-an-agent" checklist (equations only)
1. Perception: $a_1=\sigma(b+w*a_0)$ → pooling.
2. Workspace: $\mathrm{Attn}(Q,K,V)$ (select/broadcast).
3. Policy or predictor: logistic head with $J(w)$ (5.15); $\nabla J(w)$ (5.17).
4. Memory: $h_t=\phi(W_h h_{t-1}+W_x x_t+b)$ or LSTM gates.
5. Learning: backprop (9.18) + SGD $W\leftarrow W-\eta\nabla_W C$.
6. Constraints/Safety: encode rules in FOL; enforce via resolution/penalties.

---

Sources from your PDFs (where equations above are shown)
- Logistic regression: model, log-likelihood, cross-entropy, gradient, regularization (Ch. 5; Eqs. 5.7–5.21).
- SVM soft margin (primal): Eq. (5.49).
- Backprop (four equations) + SGD/minibatch: Thm. 9.3 (9.18), (9.7)–(9.11).
- CNN convolution / pooling: (9.25–9.26) and discussion.
- Matrix calculus identities & AD/adjoint: $d\log\det A$, $d(A^{-1})$, reverse-mode AD remarks, adjoint method.
- Logic / Resolution / Quantifiers: formal semantics and resolution principle overview.
