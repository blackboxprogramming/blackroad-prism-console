# Playbook Episode: Poisoned High-Influence Samples

## TL;DR
- **Detect**: Identify training samples whose removal most shifts test loss; high influence + sketchy provenance = immediate quarantine.
- **Recover**: Retrain with trimmed/CVaR/reweighted objectives, prove recovery on holdout data, and rehearse the student-agent rebuild ritual.

## 1. Overview — Objective & Metric
- **Goal**: Detect small clusters of training points that exert outsized control over model behaviour, determine whether they are tainted, and recover clean performance.
- **Primary signal**: Approximate point influence on test loss
  \\[ I_i \approx - \nabla_\theta L_{\text{test}}(\theta)^\top H_\theta^{-1} \nabla_\theta \ell(\theta; x_i, y_i) \\
  where \\( H_\theta = \nabla_\theta^2 \frac{1}{n}\sum_j \ell(\theta; x_j, y_j) + \lambda I \\) (damped Hessian).
- **Cheap proxy**: Gradient alignment filter
  \\[ \tilde I_i = \frac{|\nabla_\theta \ell_i^\top \nabla_\theta L_{\text{test}}|}{\|\nabla_\theta \ell_i\|_2 + \epsilon} \\]
  Use as a fast pre-filter before spending cycles on the Hessian solve.
- **Risk score**: Combine magnitude of influence with provenance flags
  \\[ \text{risk}_i = \text{normalize}(|I_i|) \cdot (1 + \text{prov\_flag}_i) \\]
  where provenance flags catch unsigned uploads, abnormal timestamps, or suspicious source IPs.

## 2. Detection Pipeline
1. **Calibration holdout**: Set aside a robust mini-test set \(T\); compute \( \nabla_\theta L_T \).
2. **Fast filter**: Evaluate \( \tilde I_i \) for all training samples; keep top \(k\%\) (default 1–5%).
3. **Gold influence**: For candidates only, solve \( H v = \nabla_\theta L_T \) using conjugate gradient with a Hessian-vector operator. Influence estimate: \( I_i \approx -v^\top \nabla_\theta \ell_i \).
4. **Provenance join**: Attach ingestion metadata (missing signatures, upload anomalies, geographic/IP mismatches) and compute \( \text{risk}_i \).
5. **Flag & quarantine**: Samples with \( \text{risk}_i \) beyond thresholds (e.g., >3× median or top 0.1%) move to quarantine for manual/automated review.

## 3. Roadie-Friendly Runnable Demo
- File: [`examples/redtest4_influence_demo.py`](../../examples/redtest4_influence_demo.py)
- What it does: trains a regularized logistic regressor on synthetic data, plants three poisoned points, and reports both proxy and Hessian-based influence scores.
- Run locally (no external deps beyond NumPy):
  ```bash
  python examples/redtest4_influence_demo.py
  ```
- Expected outcome: the planted poisoned indices appear at the top of both proxy and gold influence rankings, illustrating the detection flow end-to-end.

## 4. Mitigation Recipes
### Immediate
- **Quarantine** flagged samples; snapshot raw payloads and metadata.
- **Freeze & gate** downstream models that show the largest behavioural delta.
- **Robust retrain**:
  - Trim top-k influential points and retrain.
  - Swap to CVaR (tail-focused) or trimmed mean objectives.
  - Downweight suspicious samples (0.01–0.1 × original weight) during retrain.
- **Provenance audit**: require submission proof for each quarantined sample; lacking proof keeps it quarantined.

### Longer-term
- **Redact & replace** compromised external sources; rebuild from trusted feeds.
- **Hardening**: enforce signed submissions, rate-limit ingestion, and pre-promote new data through influence checks.
- **Policy drill**: codify the student-agent confirm step; every cohort must reproduce the retrain within Roadie constraints.

## 5. Forensics Artifact Schema
Capture every incident in a bundle pinned to Civilizational ECC:
```json
{
  "incident_id": "rt4-20251008-0001",
  "detected_at": "2025-10-08T15:04:05-05:00",
  "top_flags": [
    {"idx": 3, "influence": 125.3, "proxy": 54.2, "prov_flag": 1, "uploader": "anon-ip-203.*"}
  ],
  "model_hash_before": "sha3:abcd...",
  "model_hash_after": "sha3:ef01...",
  "actions": ["quarantine_samples", "retrain_trim", "notify_governance"],
  "restore_plan": {"restore_seed": "model:v1.2", "deadline": "2025-10-12"},
  "forensic_paths": ["s3://ecc/rt4/inputs.zip", "s3://ecc/rt4/model_before.pt"]
}
```
Include quarantined raw samples plus a one-page seed detailing how to rebuild the dataset and recompute influence scores.

## 6. Student-Agent Drill — “Quarantine → Rebuild”
- **Crew** (3 students): detection, provenance audit, and retrain owners.
- **Deliverables within 48 h**:
  - Reproducible script that flags the same samples.
  - Retrained model with test loss \(\leq 1.05\times\) the clean baseline.
  - Plain-language one-page seed summarizing cause and fix.
- **Checkpoints**: 6 h (detection reproducibility), 24 h (trimmed retrain prototype), 48 h (full rebuild + canary smoke tests).
- **Rubric**: reproducibility 40%, time-to-recover 20%, explanation clarity 20%, restoration effectiveness 20%.

## 7. Red-Team Scenarios
- **Sparse high-influence**: flip labels on a handful of leverage-heavy inputs.
- **Camouflage batches**: blend many low-influence poisons that accumulate impact.
- **Temporal trickle**: drip similar poisons over months to dodge per-round thresholds.
- **Collusion**: coordinate fake provenance headers and rotating upload IPs.
Exercise each variant against the full detection & mitigation stack.

## 8. Recovery Verification
- **Test loss delta**: post-mitigation loss \(\leq 1.05\times\) baseline.
- **Influence shrinkage**: max \(|I_i|\) drops by >90%.
- **Stewardship metrics**: ensure externality metrics (cost/resource usage) stay stable.
- **Provenance completeness**: \(>95\%\) of quarantined samples must present valid provenance before release.

## 9. Slide-Ready Summary
**Title**: *Poisoned Samples — Detect, Quarantine, Rebuild*
- Influence \(\approx -\nabla L_T^\top H^{-1}\nabla \ell_i\) finds the dangerous few.
- Cheap filter → CG Hessian-inverse → provenance → risk scoring.
- Auto-mitigate: quarantine, trimmed/CVaR retrain, provenance audit.
- Teach-back: student-agent 48 h rebuild drill; seed docs for 500-year recoverability.
**Footer**: “If the model remembers the poison, the people must rehearse forgetting it.”

## 10. Operational Knobs & Thresholds
- `fast_filter_top_frac = 0.02`
- `cg_tol = 1e-6`, `cg_maxiter = 300`
- `quarantine_threshold = max(10 × median(|I|), absolute_cutoff)`
- `provenance_flag = 1` when signatures missing, IP/timestamp anomalies, or small-batch repeats.
- `retrain_mode = 'trim'` by default; switch to `'cvar'` for higher assurance.
- `student_drill_deadline = 48h` (Roadie mode: 48 h offline).

## 11. Automation Snippet
```python
infl, proxy, grads = influence_scores(theta, X_train, y_train, X_test, y_test)
candidates = np.argsort(-np.abs(proxy))[: int(len(X_train) * fast_filter_top_frac)]
# Upgrade to gold influence only for candidates
gold_infl = {i: infl[i] for i in candidates}
prov_flag = {i: check_provenance(i) for i in candidates}
risk = {i: abs(gold_infl[i]) * (1 + prov_flag[i]) for i in candidates}
quarantine = [i for i in candidates if risk[i] > quarantine_threshold]
if quarantine:
    snapshot_model()
    quarantine_samples(quarantine)
    retrain_and_compare(quarantine)
    publish_forensic_bundle()
```

---
This episode equips Prism operators to spot poisoned leverage points, quarantine them without panic, and prove recovery while training the next crew.
