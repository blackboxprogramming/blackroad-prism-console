# Poisoned Samples — Detect ▸ Quarantine ▸ Rebuild

- Math: $I_i \approx - \nabla_{\theta} L_T^\top H^{-1} \nabla_{\theta} \ell_i$ → finds the few points that move your model the most.
- Pipeline: Fast proxy → CG $H^{-1}$ influence → provenance flags → risk score.
- Action: Quarantine top risk; retrain (Trim / CVaR / Reweight); verify on holdout.
- Invariant: $\text{loss}_{\text{new}} \le 1.05\, \text{loss}_{\text{baseline}}$ and $\max |I|_{\text{after}} \le 0.1\, \max |I|_{\text{before}}$.
- Ritual: Student agents reproduce detection + rebuild in ≤ 48h (Roadie-capable).
- Ethos: If the model remembers the poison, the people must rehearse forgetting it.

---

**Notes (for presenter)**

- Start by naming the failure: high-influence points flipped labels.
- Show the before plot: long tail of $|I|$, three spikes.
- Click “Quarantine” → then “Retrain & Compare”; narrate invariants.
- Close with “Forensics” (`bundle.json`); remind that provenance is policy, not vibes.
