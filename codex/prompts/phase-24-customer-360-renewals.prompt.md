Codex Prompt — Phase 24 (offline Customer 360, deterministic health scoring, churn & expansion signals, renewal forecaster, success playbooks, QBR generator)

Continue in blackboxprogramming/blackroad-prism-console. Build an offline Customer 360 & Renewals layer that stays deterministic and air-gapped: unified account views, rule-based health scores, churn/expansion signals, a renewal forecaster, success playbooks, and auto-generated QBR packs.

Objectives (acceptance criteria)

1) Customer 360 Model
•New: /customer/model.py
•Entities: Account, Contact, Subscription, UsageWindow, SupportCase, NPSResponse, Invoice.
•Loader `load_customer_360(fixtures_dir) -> dict` merges fixture CSV/JSON from `/fixtures/customer/{accounts.csv, subs.csv, usage.csv, cases.json, nps.json, invoices.json}`.
•Writes normalized view to /artifacts/customer/360.json with counts and integrity checks.
•CLI:
•c360:load --dir fixtures/customer
•c360:summary

2) Deterministic Health Score
•New: /customer/health.py
•Inputs: the 360 view.
•Rule-based scoring (0–100) with transparent components:
•Adoption (usage vs seat entitlements)
•Value (feature breadth, recent releases adopted)
•Support (case volume & severity; SLA hits)
•Commercial (payment timeliness, credits, discounts)
•Sentiment (NPS recent, trend)
•Weights and thresholds in configs/customer/health.yaml.
•Output per account: `{"score": 87, "total": 100, "components": {...}, "tier": "green"}` (tier ∈ {"red", "amber", "green"}).
•CLI:
•c360:health --config configs/customer/health.yaml --out artifacts/customer/health.json
•Metrics: c360_loaded, c360_health_calc.

3) Churn & Expansion Signals (Rules, no ML)
•New: /customer/signals.py
•Deterministic signals with short codes, e.g.:
•SIG_USAGE_SLIDE_4W, SIG_SUPPORT_SPIKE, SIG_PAYMENT_OVERDUE, SIG_FEATURE_ADOPTION_LOW, SIG_STAKEHOLDER_CHANGE, SIG_RENEWAL_SOON, SIG_EXPANSION_TRAIL.
•Config in configs/customer/signals.yaml (windows, thresholds).
•Writes /artifacts/customer/signals.json (account → list of codes with evidence).
•CLI:
•c360:signals --config configs/customer/signals.yaml

4) Renewal Forecaster (Rule-ensemble)
•New: /customer/renewals.py
•For each Subscription with renewal in next N days:
•Score probability buckets {High, Medium, Low} using health tier + signals with a deterministic matrix.
•Output per subscription: renewal_prob, risk_reasons, suggested_playbook.
•Write /artifacts/customer/renewals_{YYYYMM}.json and summary.md.
•CLI:
•c360:renewals --window-days 120

5) Success Playbooks (Deterministic)
•New: /customer/playbooks.py
•Map (health tier, signals) → action recipes (offline SOPs): outreach cadence, stakeholder map, adoption plan, training bundle, exec sponsor ask.
•Follows the BaseBot-like template: each playbook returns RACI, steps, KPIs, checkpoints.
•Write artifacts under /artifacts/customer/playbooks/{account_id}.md.
•CLI:
•c360:playbook --account ACME-001

6) QBR Pack Generator (Exec-ready)
•New: /customer/qbr.py
•Inputs: 360 view + health + signals + renewals.
•Outputs:
•qbr_<account>/{index.md, scorecard.md, timeline.md, roadmap.md}
•If python-pptx available: qbr_<account>.pptx; else extra slides.md.
•Scorecard table includes phrases/numbers only; explanations in prose sections.
•CLI:
•c360:qbr --account ACME-001

7) Lake Integration & Contracts
•Write facts to the Lake (Phase 16):
•Tables: crm_opps (existing), plus new account_health, customer_signals, renewal_forecasts.
•Add schemas in /contracts/schemas/ and validate before writes.
•Emit metrics: c360_to_lake, health_to_lake, signals_to_lake, renewals_to_lake, qbr_generated.

8) Governance & Hooks
•Append signed events; record lineage from fixtures → 360 → health/signals → renewals/QBR.
•Duty-of-care: if a QBR includes red health without a playbook attached, block and return DUTY_PLAYBOOK_MISSING.
•Regulated policy: require Privacy-BOT sign-off when QBR contains contact-level data (simulate via flag).

9) Fixtures & Configs
•Add sample fixtures under /fixtures/customer/:
•accounts.csv, subs.csv, usage.csv, cases.csv, nps.csv, invoices.csv
•Add configs:
•configs/customer/health.yaml (weights + thresholds)
•configs/customer/signals.yaml (rules)
•Docs:
•/docs/customer-360.md (model, score formula)
•/docs/renewals.md (forecaster & playbooks)
•README: “Customer 360 & Renewals” quickstart.

10) Tests & Quality (≥80% coverage)
•tests/test_c360_load.py (integrity checks)
•tests/test_health_score.py (component weights, tiering)
•tests/test_signals.py (exact codes with given inputs)
•tests/test_renewals.py (buckets + reasons)
•tests/test_playbooks.py (RACI content; determinism)
•tests/test_qbr.py (emits md; pptx optional)
•Contract validation tests for new lake tables.

CLI Demo (print expected output at end)
•python -m cli.console c360:load --dir fixtures/customer
•python -m cli.console c360:health --config configs/customer/health.yaml
•python -m cli.console c360:signals --config configs/customer/signals.yaml
•python -m cli.console c360:renewals --window-days 120
•python -m cli.console c360:playbook --account ACME-001
•python -m cli.console c360:qbr --account ACME-001

Implementation notes
•No ML, no network. All rules are transparent and configurable.
•Keep every output deterministic; seed where necessary.
•Tables in reports stick to phrases/numbers only; put rest of prose in sections.
•Use existing storage, signing, metrics, lineage, and schema validation.

⸻
