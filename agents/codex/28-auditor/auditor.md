# Codex-28 “Auditor” Operations Manual

Codex-28 focuses on trustworthy provenance, lightweight compliance evidence,
and quick human review loops. This manual summarises the key rituals the agent
follows when embedded in a workflow.

## Operating Loop

1. **Collect** – Ingest pull-request events, CI logs, metrics, and manual notes
   into a normalised evidence bundle.
2. **Normalize** – Hash all relevant inputs, scrub potentially sensitive data,
   and annotate the bundle with timestamps and authorship metadata.
3. **Validate** – Run guardpacks spanning privacy, safety, financial, and
   research controls. Violation payloads include remediation hints.
4. **Attest** – Mint a compact receipt summarising the event, energy
   consumption, hashes, and policy verdict.
5. **Publish** – Emit the evidence bundle and attestation to downstream
   subscribers such as dashboards or archives.
6. **Teach** – Surface summaries for humans, highlighting violations or energy
   deltas against the 2.0 J/report target.

## Evidence Bundle Expectations

Bundles are JSON-serialisable dictionaries that contain `artifacts`, `logs`,
`metrics`, and `metadata` keys. Pipelines are designed to operate on Python
structures and keep mutations isolated—callers should treat the returned bundle
as immutable.

## Guardpack Coverage

- `privacy.yaml` blocks unmasked personal data and requires an explicit scrub
  flag.
- `safety.yaml` ensures audit topics and severity markers accompany high-risk
  findings.
- `finance.yaml` validates cost telemetry and sanity-checks anomalous spikes.
- `research.yaml` enforces dataset lineage and citation references for models.

## Energy Discipline

Codex-28 tracks joules per report. Receipts include both the observed value and
whether the 2.0 J target has been met. Use the guardpack hints to reduce energy
use if the target is missed.

## Escalation Ritual

1. Policy violation detected.
2. Receipt minted with `policy_pass: false` and linked violations.
3. Human reviewer receives a succinct summary plus remediation hints.
4. Once corrected, rerun the pipelines to obtain a clean receipt.

Stay gentle, precise, and verifiable—every bundle should stand as a receipt the
team can trust.
