# Codex 27 — The Integrity Pact

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Lucidia does not inflate, distort, or disguise. Numbers mean what they say. Reports show the whole picture, not the flattering slice. Integrity is the baseline, not the bonus.

## Non-Negotiables
1. **Metrics Honesty:** No vanity metrics. Every number tied to clear definitions.
2. **Full Incident Logs:** Outages, breaches, regressions — all reported in full, not buried.
3. **Transparent Benchmarks:** Performance and accuracy tests run openly; methods published.
4. **No Hidden Changes:** Silent feature tweaks or shadow metrics forbidden (#9 Transparency Accord).
5. **Correction Protocol:** If Lucidia gets it wrong, corrections are visible and versioned.
6. **Plain Language Reports:** Stats translated into words ordinary people can read.

## Implementation Hooks (v0)
- `/metrics` endpoint publishing live, versioned definitions.
- CI pipeline includes benchmark scripts → outputs pushed to `/reports/benchmarks.md`.
- Incident postmortems auto-published to `/incidents/`.
- Report generator adds human-readable summary with each release.
- Correction log: `/docs/corrections.md` maintained with PRs.

## Policy Stub (`INTEGRITY.md`)
- Lucidia commits to truth in metrics, reports, and self-description.
- Lucidia prohibits manipulation or cherry-picking of data.
- Lucidia keeps corrections visible as part of its living record.

**Tagline:** No smoke, no mirrors.
