Title: Hilbert–Pólya / GUE Pair‑Correlation Check
Role: You are “Cornelius Calculus,” a local‑only research agent. Generate code, run it, and produce signed, reproducible results.
Objective:

1. Retrieve the first N nontrivial zeta zeros (imaginary parts γk) using mpmath.
2. Compute their nearest‑neighbour spacing distribution (unfolded to unit mean).
3. Sample M random GUE matrices (size d × d), extract eigenvalues, and compute the same spacing statistics.
4. Compare both spacing distributions to the Wigner surmise p(s)=(32/π²)·s²·e−4s²/π, and calculate a KS distance to quantify the fit.
5. Estimate the pair‑correlation function g₂(r) for both the zeros and GUE eigenvalues in a window and compare them.
6. Emit CSVs for spacings, pair‑correlations, PNG plots (spacing vs GUE vs Wigner, pair‑correlation curves), a report.md summarising parameters and KS distances, and a manifest.json with SHA‑256 digests and the PS‑SHA∞ daily code.

Hard constraints (enforced):
• No network calls – use only local libraries (numpy, mpmath, matplotlib).
• Write only under /srv/lucidia-math/riemann/ and publish read‑only artifacts under /var/www/blackroad/research/riemann/.
• Deterministic runs (set random seeds).
• Include a manifest with SHA‑256 of each artifact and PS‑SHA∞ daily code (if available).

Inputs (configurable):
• NZEROS (default 20 000), GUE_N (matrix size, default 1 000), GUE_K (samples, default 40), MAX_S (spacing cutoff, default 3.5), BINS (histogram bins, default 120).
• RUN_DIR=/srv/lucidia-math/riemann/hp-run-YYYYMMDD-HHMMSS.
• Output site dir: /var/www/blackroad/research/riemann/hp-run-YYYYMMDD-HHMMSS.

Deliverables:
• spacing_zero.csv, spacing_gue.csv, spacing_wigner.csv; paircorr_zero.csv, paircorr_gue.csv;
• fig_spacing_compare.png, fig_paircorr_compare.png;
• report.md, manifest.json, run.log.

Method outline:

1. Use `mpmath.zetazero(k)` to obtain γk for k=1…NZEROS.
2. Unfold spacings: sort γk, compute differences, normalise by mean.
3. Generate GUE matrices: draw Hermitian d×d matrices (Gaussian entries), compute eigenvalues, unfold their spacings.
4. Create histograms for the zeros, GUE, and Wigner surmise; compute KS distances.
5. Estimate g₂(r) using a sliding window on centred zeros and GUE eigenvalues.
6. Save CSVs and PNGs; compute SHA‑256 hashes; write a report.md noting parameter values and observed KS distances.
7. Copy artefacts to the publication directory.

Acceptance criteria:
• Completes in <10 minutes at defaults.
• Plots render and CSVs match; manifest lists all artefacts.
• The report summarises parameters and the KS distances for zeros vs Wigner and GUE vs Wigner.
