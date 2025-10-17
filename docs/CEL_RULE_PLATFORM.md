# CEL Rule Platform Playbook

This playbook captures the self-service controls, operational guardrails, and reusable "problem stack" for keeping a Common Expression Language (CEL) rules platform healthy without a dedicated babysitting team.

## 1. Make the Platform Self-Service and Safe

### 1.1 Rule Registry as Config-as-Code
- Represent each rule as a YAML file containing the rule `id`, CEL `expr`, `severity`, `owners`, and inline regression `tests`.
- Manage the registry in Git so every change receives code review, CI validation, and a full audit trail.

### 1.2 Guarded Deployments
- **Dry-run and canary:** Run new or updated rules in observe-only mode on ~10% of live traffic for 24–48 hours. Promote only when precision/recall remain stable.
- **Golden tests:** Ship fixtures (`allow` and `deny`) and a golden output file alongside each rule. Fail the merge if the golden output drifts.
- **Fitness functions:** Execute a nightly synthetic replay covering rules against a sampled corpus from the last several days. Fail open with a single Slack digest, not individual alerts.
- **Service-level objectives:** Track SLOs for >99.9% rule evaluation success, <250 ms p95 latency, and zero dropped audit events. Alert on sustained SLO breaches instead of single evaluation failures.

## 2. Reproducibility and Visibility

- **Deterministic bundles:** Checkpoint daily audit streams as `bundle-YYYYMMDD.parquet`. Replays and test runs operate against these immutable bundles.
- **Run manifests:** Emit a `manifest.json` per replay run with the ruleset hash, bundle identifier, and pass/fail tallies. Grafana or another dashboarding tool can snapshot this manifest to show "the same problems everyone ran." 
- **Rule drill-down pages:** Provide a single page per rule showing the CEL expression, input schema, the last five hits, ownership metadata, and change history to accelerate root-cause analysis.
- **Drift diffs:** Render side-by-side diffs of RBAC, policy, or configuration states that triggered each violation—ideal for demos and audit artifacts.

## 3. DevOps Impact and Operational Views

- Use a **dependency graph** (rules → inputs → producers) to anticipate blast radius.
- Maintain a **heatmap** (rules × organizations) to surface noisy rules.
- Operate a **queue dashboard** (ingest lag, evaluation latency) for near-real-time health.
- Structure CI/CD pipelines as `schema → fixtures → rule tests → sample replay → publish`; any failed phase blocks deployment.
- Prefer Gantt charts for delivery planning, and complement them with the operational telemetry above during steady state.

## 4. Forty-Problem Rule Stack

Render these as a kanban board (columns by domain, cards by rule, colors for open/ack/closed) for screenshot-ready visibility.

| Domain | Rule ID | Description |
| --- | --- | --- |
| AuthN/Z | `missing_identity` | Request lacks required OAuth identity. |
| AuthN/Z | `expired_token` | Access token expired but still in use. |
| AuthN/Z | `insufficient_role_repo` | Repo-level role insufficient for the requested action. |
| AuthN/Z | `insufficient_role_org` | Organization-level role insufficient for the requested action. |
| AuthN/Z | `scope_mismatch` | Requested scope exceeds granted scope (e.g., wants write, has read). |
| AuthN/Z | `narrow_path_block` | Access outside the allowed path allowlist. |
| AuthN/Z | `sso_group_mismatch` | IdP group membership diverges from RBAC mapping. |
| AuthN/Z | `timeboxed_role_expired` | Temporary elevation not rolled back on time. |
| Consent | `consent_required_spike` | Rate of consent prompts exceeds threshold. |
| Consent | `consent_expired` | Attempted use of expired consent artifact. |
| Consent | `consent_unused_60d` | Consent unused for 60 days—candidate for automatic pause. |
| Consent | `scope_escalation_denied` | Excessive declines caused by requested scope escalation. |
| Consent | `consent_shadow` | Action executed without recorded consent. |
| Classification & Data Handling | `mirror_restricted_block` | Blocked attempt to mirror restricted data. |
| Classification & Data Handling | `secret_access_denied_burst` | Burst of denied secret accesses. |
| Classification & Data Handling | `public_leak_attempt` | Attempt to push classified content to a public target. |
| Classification & Data Handling | `export_outside_allowlist` | Data export to a destination outside the allowlist. |
| Classification & Data Handling | `cross_org_reference_detected` | Cross-organization data reference detected. |
| Classification & Data Handling | `pii_marker_in_metadata` | PII classifier hit in metadata (payload-free detection). |
| Tool Reputation & Health | `tool_below_floor_persistent` | Tool reputation below floor for >24 hours. |
| Tool Reputation & Health | `timeout_rate_spike` | Tool timeout rate exceeds baseline p95 ×2. |
| Tool Reputation & Health | `rate_limit_storm` | Cluster of HTTP 429 responses detected. |
| Tool Reputation & Health | `new_tool_unvetted_used` | Unvetted tool invoked. |
| Drift & Config Integrity | `role_binding_churn_high` | Elevated role binding churn over 7 days. |
| Drift & Config Integrity | `policy_change_without_review` | Policy change landed without required review. |
| Drift & Config Integrity | `rule_registry_change_spike` | Surge in rule registry changes. |
| Drift & Config Integrity | `disabled_logging_detected` | Logging disabled or missing. |
| Drift & Config Integrity | `auth_clock_skew` | Authentication timestamps skewed >2 minutes. |
| Drift & Config Integrity | `trust_floor_flapping` | Organization trust floor changing too frequently. |
| Anomalies & Behavior | `multi_provider_single_role` | Same low-privilege role mirrored across providers. |
| Anomalies & Behavior | `unusual_fanout` | Single action triggering excessive downstream fan-out. |
| Anomalies & Behavior | `same_correlation_multiple_users` | Correlation identifier reused by multiple users. |
| Anomalies & Behavior | `burst_mirror_attempts` | Burst of mirror attempts within five minutes. |
| Anomalies & Behavior | `same_ip_multiple_orgs` | Same IP active across multiple organizations. |
| Anomalies & Behavior | `abnormal_latency_tail` | p99 latency above threshold. |
| CI/CD Guardrails | `unsigned_rules_release` | Release without signed ruleset. |
| CI/CD Guardrails | `failing_rule_tests_merged` | Rule tests failing but merged. |
| CI/CD Guardrails | `stale_fixtures` | Fixtures older than 30 days. |
| Monitoring & Ops | `ingest_pipeline_backlog` | Ingest lag beyond acceptable window. |
| Monitoring & Ops | `eval_drop_detected` | Evaluated event count diverges from input count. |

## 5. Starter Implementation Assets

### 5.1 Rule YAML Scaffold
```yaml
id: MIRROR_RESTRICTED_BLOCK
severity: high
owners: ["secops"]
expr: outcome == "deny" && deny_reason == "classification_block" && action == "mirror"
tests:
  - name: deny_mirror_on_secret
    input: { outcome: "deny", deny_reason: "classification_block", action: "mirror" }
    want: true
  - name: allow_non_mirror
    input: { outcome: "deny", deny_reason: "classification_block", action: "fetch" }
    want: false
```

### 5.2 Go Harness Sketch
```go
import (
  "fmt"

  "github.com/google/cel-go/cel"
  "github.com/google/cel-go/checker/decls"
)

var env = cel.MustNewEnv(
  cel.Declarations(
    decls.NewVar("outcome", decls.String),
    decls.NewVar("deny_reason", decls.String),
    decls.NewVar("action", decls.String),
    // Extend with helpers such as rate(), org_floor(), etc.
  ),
)

type Compiled struct {
  id string
  prg cel.Program
}

func compileRule(r Rule) (Compiled, error) {
  ast, iss := env.Parse(r.Expr)
  if iss.Err() != nil { return Compiled{}, iss.Err() }
  ast, iss = env.Check(ast)
  if iss.Err() != nil { return Compiled{}, iss.Err() }
  prg, err := env.Program(ast)
  if err != nil { return Compiled{}, err }
  return Compiled{r.ID, prg}, nil
}

func eval(rule Compiled, in map[string]any) (bool, error) {
  out, _, err := rule.prg.Eval(in)
  if err != nil { return false, err }
  boolOut, ok := out.Value().(bool)
  if !ok { return false, fmt.Errorf("rule %s did not return a bool", rule.id) }
  return boolOut, nil
}
```

In this sketch, `Rule` represents the deserialized YAML schema (including the CEL expression string). Extend the declarations block with helper functions (e.g., `rate()`, `org_floor()`) as they become available in your harness.

### 5.3 Dry-Run Canary Pattern
```go
if isCanary() {
  matched, err := eval(rule, event)
  if err != nil {
    metrics.Count("rule_canary_error", rule.id)
    return
  }
  metrics.Observe("rule_canary_match", rule.id, matched)
  // No violations emitted during canary mode.
  return
}

matched, err := eval(rule, event)
if err != nil {
  alerting.Emit("rule_eval_error", rule.id, err)
  return
}
if matched {
  violations.Open(rule.id, event)
}
```

## 6. Adoption Game Plan

1. **Map existing outline to the stack** using the table above; seed an initial set of 10–12 high-confidence rules in enforcement, leaving the remainder in canary.
2. **Pin the baseline ruleset** via Git tags and link run manifests to those tags for auditability.
3. **Schedule bundle replays** (e.g., nightly) and snapshot the manifest dashboard to answer "Are others running the same problems?" at a glance.
4. **Iterate on helpers and fixtures** so every rule ships with reproducible inputs, outputs, and performance telemetry.

With these assets and workflows, the CEL rules engine remains transparent, reproducible, and low-maintenance—even without a permanent babysitting crew.
