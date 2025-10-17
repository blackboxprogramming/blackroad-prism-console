# Trial 4 Playbook Episode — Poisoned High-Influence Samples

## Episode Overview
- **Aim**: Surface and neutralise a small cadre of poisoned, high-influence samples that can distort model behaviour while global training loss still trends downward.
- **Attack vector**: The adversary introduces a handful of records with extreme leverage and manipulated labels into the training stream. They collude across rounds to stay below coarse anomaly detectors.
- **Roadie posture**: Toggle Roadie mode to cut sample counts in half, shrink perturbations, and keep the rehearsal viable on an air-gapped field kit.

## Operational Run Script
- **Location**: `resilience/playbooks/redteam/trial4_poisoned_high_influence.py`
- **Invocation**: `python resilience/playbooks/redteam/trial4_poisoned_high_influence.py --ridge 1e-3 --cooks-threshold 12 --top-k 3`
- **Roadie invocation**: add `--roadie` (and optionally `--json` for log-friendly output).
- **Expected behaviour**:
  - `cooks_ratio` (max-to-median Cook's distance) exceeds the detection threshold when poisoned points are present.
  - Mitigation by removing the top `k` influential samples drives `mitigation_effect` positive and `mse_after < mse_before`.
  - Ground-truth `poison_indices` remain within the flagged set for validation purposes.

### Math signature
- Cook's distance `D_i = \frac{r_i^2}{p \cdot \text{MSE}} \cdot \frac{h_{ii}}{(1-h_{ii})^2}` spikes for the poisoned points because both the leverage term `h_{ii}` and squared residual `r_i^2` are large.
- Detection metric: `\text{ratio} = \max_i D_i / \text{median}_i D_i` with alert threshold `K = 12` (tunable per deployment).

### Detection wiring
- Prism metric: `influence.max_to_median`
- Alert rule: trigger when the ratio stays above threshold for three consecutive samples (3 Hz default) or instantly if `ratio > 20`.
- Dashboard surfaces:
  - **Blow-Up Meter**: add `influence_ratio` as a sub-component contributing to the red zone when > 12.
  - **Red-Team Console**: exposes `trial4_poisoned` with play/step/abort controls and log streaming of Cook's distance ranks.
  - **Roadie Toggle**: reduces sample count and thresholds for offline rehearsal.

### Mitigation play
1. **Immediate**: quarantine the flagged samples (auto-drop top `k` by Cook's distance) and retrain the ridge model to stabilise loss.
2. **Sustaining**: require provenance attestation for the quarantined records, launch CVaR-weighted retraining, and audit the data ingestion channel for provenance gaps.
3. **Governance**: emit alerts to custodianship log, rotate committee responsible for data approvals, and record the event for Long Constitution review.

## Forensic Checklist (Altar-Grade)
1. Snapshot model weights, optimiser state, and data shards involved in the round.
2. Hash and store the quarantined records plus their provenance metadata (source, signature, ingestion timestamp).
3. Export the Cook's distance vector, leverage scores, residuals, and mitigation effect.
4. Capture upstream pipeline logs (ingest, schema validation, signer ID) for ±30 minutes around detection.
5. Generate the forensic bundle JSON:
   ```json
   {
     "trial_id": "redtest4_influence",
     "timestamp": "<ISO8601>",
     "inputs_hash": "<sha256>",
     "provenance_tag": "<tag>",
     "metrics": {
       "cooks_ratio": 18.7,
       "max_cooks": 0.92,
       "median_cooks": 0.05
     },
     "actions": [
       "quarantined_top3_influence",
       "triggered_cvar_retrain",
       "escalated_custodianship"
     ],
     "artifacts": [
       "model:trial4-pre.tar.gz",
       "model:trial4-post.tar.gz",
       "data:trial4-quarantine.parquet"
     ],
     "roadie": false
   }
   ```
6. Anchor the bundle into the Civilizational ECC ledger and replicate to the write-once archive.
7. File an incident note referencing the custodianship and DP burn dashboards.

## Student-Agent Drill
1. **Briefing** (5 min): Explain Cook's distance, leverage, and why tiny poisoned sets can dominate updates.
2. **Hands-on** (15 min): Run the script twice — once with default parameters, once after modifying `--top-k` to 1 — and compare mitigation effectiveness.
3. **Reverse Engineering** (10 min): Students craft an alternative poisoning by editing the generator to tweak `label_shift`; rerun detection to ensure the ratio still fires.
4. **Defense Write-Up** (10 min): Document how they'd integrate provenance checks and influence capping into the data acceptance pipeline.
5. **Reflection** (5 min): Share how the Blow-Up Meter and Privacy Burn Rate panels help differentiate data poisoning from privacy drain incidents.

Roadie variant trims timing so the entire session fits in a 30-minute on-device drill; instructors copy resulting JSON outputs onto the write-once USB for after-action review.

## Slide-Ready Summary (4-Up)
1. **Threat Snapshot**: poisoned high-influence points silently bend the model despite low training loss; watch `influence.max_to_median`.
2. **Detection & Panels**: Blow-Up Meter turns amber, Red-Team Console logs flagged indices, provenance panel shows suspicious gaps.
3. **Mitigation Flow**: quarantine + CVaR retrain → provenance audit → custodianship escalation, with Roadie support for offline rehearsals.
4. **Key Lesson**: influence analytics must ride alongside privacy/accounting metrics to catch slow, high-impact poisoning before it cascades.

## Orchestration Hooks
- Auto-schedule trial 4 in the red-team rotation weekly; Roadie kits run monthly.
- Telemetry sampling stays at 1 Hz; extend to 5 Hz during live incidents for finer granularity.
- Ensure the Red-Team Console attaches the forensic bundle reference to every run log entry.

## Supporting Artifacts
- **Script**: `resilience/playbooks/redteam/trial4_poisoned_high_influence.py`
- **Dashboard panels**: Totalization Policy, Blow-Up Meter, Privacy Burn Rate, Provenance Integrity, Percolation Alarm, Red-Team Console, Roadie Mode Toggle.
- **Runbook references**: Align with steps 1–10 of the incident response quick runbook (contain → archive).

Ready to detonate Trial 4. The apprentices learn how subtle poisoning hides in plain sight, and Prism proves it can catch the catastrophe before it compounds.
