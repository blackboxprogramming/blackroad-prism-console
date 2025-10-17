# 6. Experimental Diagnostics

We validate Codex resonance with four families of tests:

1. **Tap-Null vs Base ISI** — ISI MSE collapses by orders of magnitude across codes (4-ary and 8-ary).  
   *Fig. 6.1* `tap_null_vs_base.png`, *Fig. 6.2* `4ary_8ary_tapnull.png`.

2. **Selector Ablations & Autocorrelation** — odd/even modular selectors suppress ISI; random_A4 ACF is near-white while `i^n` shows periodic resonance.  
   *Fig. 6.3* `selectors_vs_base.png`.

3. **Variance Surfaces & Optimizers** — trinary variance heatmaps match closed-form invariants; optimizer sweeps remain on a flat, stable manifold.  
   *Fig. 6.4* `trinary_variance_heatmap.png`.

4. **N-phase Cancellation & Weierstrass Scaling** — superposition cancels near machine epsilon; structure function shows fractal self-similarity.  
   *Fig. 6.5* `nphase_cancellation.png`, *Fig. 6.6* `weierstrass_scaling.png`.

**Takeaway:** Tap-Null + selector logic give deterministic ISI control; resonance manifolds are flat and robust; diagnostics differentiate resonance from noise convincingly.
