| Workflow | File | Triggers | Owners | Permissions | Compliance |
| --- | --- | --- | --- | --- | --- |
| Deploy to Droplet | `.github/workflows/00deploy.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Access Lifecycle | `.github/workflows/access-lifecycle.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Access Review (Quarterly) | `.github/workflows/access-review-quarterly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Accessibility + SEO (advisory) | `.github/workflows/accessibility.yml` | pull_request, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Address Digests | `.github/workflows/addresses-digests.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Agent PR Autopilot | `.github/workflows/agent-pr.yml` | issue_comment, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Agent Queue | `.github/workflows/agent-queue.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| AI Evaluations (Nightly) | `.github/workflows/ai-evals.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| AI Experiments Runner | `.github/workflows/ai-experiments.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| AI RAG Refresh | `.github/workflows/ai-rag-refresh.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| AIOps Daily (Monitor + Alerts + Report) | `.github/workflows/aiops-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| aiops-release | `.github/workflows/aiops-release.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| AIOps Train (Train + Evaluate) | `.github/workflows/aiops-train.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ar-monthly | `.github/workflows/ar-monthly.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| ATS Monthly (Time-to-Fill + Offers) | `.github/workflows/ats-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ATS Weekly (Pipeline + DEI) | `.github/workflows/ats-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Weekly Audit | `.github/workflows/audit.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| auto-fix | `.github/workflows/auto-fix.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:write, pull-requests:write | Needs concurrency |
| auto-heal | `.github/workflows/auto-heal.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while parsing a flow mapping |
| auto-mention | `.github/workflows/auto-mention.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while parsing a block mapping |
| Auto Remediate | `.github/workflows/auto-remediate.yml` | workflow_dispatch, repository_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| 🔁 Auto Re-run Failed Jobs (max 3) | `.github/workflows/auto-rerun-failed.yml` | workflow_run | @BlackRoadTeam, @Cadillac | actions:write, contents:read, pull-requests:write | Needs concurrency |
| automation-drift-detection | `.github/workflows/automation-drift-detection.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 201 · Telemetry Retention Sweep | `.github/workflows/automation-task-201.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 202 · Telemetry Cache Rehearsal | `.github/workflows/automation-task-202.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 203 · Telemetry Review Cadence | `.github/workflows/automation-task-203.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 204 · Telemetry Rotation Drill | `.github/workflows/automation-task-204.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 205 · Telemetry Catalog Sync | `.github/workflows/automation-task-205.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 206 · Telemetry Health Audit | `.github/workflows/automation-task-206.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 207 · Telemetry Validation Sweep | `.github/workflows/automation-task-207.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 208 · Telemetry Regression Scan | `.github/workflows/automation-task-208.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 209 · Telemetry Recovery Drill | `.github/workflows/automation-task-209.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 210 · Telemetry Forecast Update | `.github/workflows/automation-task-210.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 211 · Edge Retention Sweep | `.github/workflows/automation-task-211.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 212 · Edge Cache Rehearsal | `.github/workflows/automation-task-212.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 213 · Edge Review Cadence | `.github/workflows/automation-task-213.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 214 · Edge Rotation Drill | `.github/workflows/automation-task-214.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 215 · Edge Catalog Sync | `.github/workflows/automation-task-215.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 216 · Edge Health Audit | `.github/workflows/automation-task-216.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 217 · Edge Validation Sweep | `.github/workflows/automation-task-217.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 218 · Edge Regression Scan | `.github/workflows/automation-task-218.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 219 · Edge Recovery Drill | `.github/workflows/automation-task-219.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 220 · Edge Forecast Update | `.github/workflows/automation-task-220.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 221 · Access Retention Sweep | `.github/workflows/automation-task-221.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 222 · Access Cache Rehearsal | `.github/workflows/automation-task-222.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 223 · Access Review Cadence | `.github/workflows/automation-task-223.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 224 · Access Rotation Drill | `.github/workflows/automation-task-224.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 225 · Access Catalog Sync | `.github/workflows/automation-task-225.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 226 · Access Health Audit | `.github/workflows/automation-task-226.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 227 · Access Validation Sweep | `.github/workflows/automation-task-227.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 228 · Access Regression Scan | `.github/workflows/automation-task-228.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 229 · Access Recovery Drill | `.github/workflows/automation-task-229.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 230 · Access Forecast Update | `.github/workflows/automation-task-230.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 231 · Secrets Retention Sweep | `.github/workflows/automation-task-231.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 232 · Secrets Cache Rehearsal | `.github/workflows/automation-task-232.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 233 · Secrets Review Cadence | `.github/workflows/automation-task-233.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 234 · Secrets Rotation Drill | `.github/workflows/automation-task-234.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 235 · Secrets Catalog Sync | `.github/workflows/automation-task-235.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 236 · Secrets Health Audit | `.github/workflows/automation-task-236.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 237 · Secrets Validation Sweep | `.github/workflows/automation-task-237.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 238 · Secrets Regression Scan | `.github/workflows/automation-task-238.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 239 · Secrets Recovery Drill | `.github/workflows/automation-task-239.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 240 · Secrets Forecast Update | `.github/workflows/automation-task-240.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 241 · Artifact Retention Sweep | `.github/workflows/automation-task-241.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 242 · Artifact Cache Rehearsal | `.github/workflows/automation-task-242.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 243 · Artifact Review Cadence | `.github/workflows/automation-task-243.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 244 · Artifact Rotation Drill | `.github/workflows/automation-task-244.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 245 · Artifact Catalog Sync | `.github/workflows/automation-task-245.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 246 · Artifact Health Audit | `.github/workflows/automation-task-246.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 247 · Artifact Validation Sweep | `.github/workflows/automation-task-247.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 248 · Artifact Regression Scan | `.github/workflows/automation-task-248.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 249 · Artifact Recovery Drill | `.github/workflows/automation-task-249.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 250 · Artifact Forecast Update | `.github/workflows/automation-task-250.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 251 · Pipeline Retention Sweep | `.github/workflows/automation-task-251.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 252 · Pipeline Cache Rehearsal | `.github/workflows/automation-task-252.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 253 · Pipeline Review Cadence | `.github/workflows/automation-task-253.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 254 · Pipeline Rotation Drill | `.github/workflows/automation-task-254.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 255 · Pipeline Catalog Sync | `.github/workflows/automation-task-255.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 256 · Pipeline Health Audit | `.github/workflows/automation-task-256.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 257 · Pipeline Validation Sweep | `.github/workflows/automation-task-257.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 258 · Pipeline Regression Scan | `.github/workflows/automation-task-258.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 259 · Pipeline Recovery Drill | `.github/workflows/automation-task-259.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 260 · Pipeline Forecast Update | `.github/workflows/automation-task-260.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 261 · Schema Retention Sweep | `.github/workflows/automation-task-261.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 262 · Schema Cache Rehearsal | `.github/workflows/automation-task-262.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 263 · Schema Review Cadence | `.github/workflows/automation-task-263.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 264 · Schema Rotation Drill | `.github/workflows/automation-task-264.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 265 · Schema Catalog Sync | `.github/workflows/automation-task-265.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 266 · Schema Health Audit | `.github/workflows/automation-task-266.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 267 · Schema Validation Sweep | `.github/workflows/automation-task-267.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 268 · Schema Regression Scan | `.github/workflows/automation-task-268.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 269 · Schema Recovery Drill | `.github/workflows/automation-task-269.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 270 · Schema Forecast Update | `.github/workflows/automation-task-270.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 271 · Latency Retention Sweep | `.github/workflows/automation-task-271.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 272 · Latency Cache Rehearsal | `.github/workflows/automation-task-272.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 273 · Latency Review Cadence | `.github/workflows/automation-task-273.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 274 · Latency Rotation Drill | `.github/workflows/automation-task-274.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 275 · Latency Catalog Sync | `.github/workflows/automation-task-275.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 276 · Latency Health Audit | `.github/workflows/automation-task-276.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 277 · Latency Validation Sweep | `.github/workflows/automation-task-277.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 278 · Latency Regression Scan | `.github/workflows/automation-task-278.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 279 · Latency Recovery Drill | `.github/workflows/automation-task-279.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 280 · Latency Forecast Update | `.github/workflows/automation-task-280.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 281 · Resiliency Retention Sweep | `.github/workflows/automation-task-281.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 282 · Resiliency Cache Rehearsal | `.github/workflows/automation-task-282.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 283 · Resiliency Review Cadence | `.github/workflows/automation-task-283.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 284 · Resiliency Rotation Drill | `.github/workflows/automation-task-284.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 285 · Resiliency Catalog Sync | `.github/workflows/automation-task-285.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 286 · Resiliency Health Audit | `.github/workflows/automation-task-286.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 287 · Resiliency Validation Sweep | `.github/workflows/automation-task-287.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 288 · Resiliency Regression Scan | `.github/workflows/automation-task-288.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 289 · Resiliency Recovery Drill | `.github/workflows/automation-task-289.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 290 · Resiliency Forecast Update | `.github/workflows/automation-task-290.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 291 · Cost Retention Sweep | `.github/workflows/automation-task-291.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 292 · Cost Cache Rehearsal | `.github/workflows/automation-task-292.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 293 · Cost Review Cadence | `.github/workflows/automation-task-293.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 294 · Cost Rotation Drill | `.github/workflows/automation-task-294.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 295 · Cost Catalog Sync | `.github/workflows/automation-task-295.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 296 · Cost Health Audit | `.github/workflows/automation-task-296.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 297 · Cost Validation Sweep | `.github/workflows/automation-task-297.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 298 · Cost Regression Scan | `.github/workflows/automation-task-298.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 299 · Cost Recovery Drill | `.github/workflows/automation-task-299.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Automation Task 300 · Cost Forecast Update | `.github/workflows/automation-task-300.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| autopal-smoke | `.github/workflows/autopal-smoke.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| Backups | `.github/workflows/backups.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| BCDR Daily (Backup Status) | `.github/workflows/bcdr-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| BCDR Monthly (Restore Audit + Drills + Resilience Report) | `.github/workflows/bcdr-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| BI Dashboards Publish | `.github/workflows/bi-publish.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Billing Close (Monthly Overages) | `.github/workflows/billing-close.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| BlackRoad • Deploy | `.github/workflows/blackroad-deploy.yml` | push, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Board Pack (Monthly) | `.github/workflows/board-pack.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Calm ChatOps v2 | `.github/workflows/calm-chatops.yml` | issue_comment | @BlackRoadTeam, @Cadillac | contents:write, pull-requests:write, issues:write, actions:read | Needs concurrency |
| collatz-ci | `.github/workflows/campaign.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| canary | `.github/workflows/canary.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while parsing a flow mapping |
| Captions CI | `.github/workflows/captions-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| care-gate | `.github/workflows/care-gate.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| Change Approval Gate | `.github/workflows/change-approve.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Change Weekly (CAB Digest) | `.github/workflows/change-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ChatOps Command Router | `.github/workflows/chatops.yml` | issue_comment | @BlackRoadTeam, @Cadillac | actions:write, contents:write, issues:write, pull-requests:write | Needs concurrency |
| Autopal Express CI | `.github/workflows/ci-autopal-express.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Autopal FastAPI CI | `.github/workflows/ci-autopal-fastapi.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| prism-console-ci | `.github/workflows/ci.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read, checks:read | Needs concurrency |
| sim-ci | `.github/workflows/ci_sim.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| prism-cli-validation | `.github/workflows/cli-validation.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| CLM Monthly (Repository Report) | `.github/workflows/clm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CLM Obligations Check | `.github/workflows/clm-obligations-check.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CLM Renewal Reminders | `.github/workflows/clm-renewal-reminders.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CLM Signature Ingest | `.github/workflows/clm-signature-ingest.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CLM Weekly (Obligations + Renewals) | `.github/workflows/clm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CMDB Nightly (Discovery + Drift + Graph) | `.github/workflows/cmdb-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| codeql | `.github/workflows/codeql.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while parsing a flow mapping |
| Codex Bridge | `.github/workflows/codex-bridge.yml` | issue_comment | @BlackRoadTeam, @Cadillac | contents:write, pull-requests:write, issues:write | Needs concurrency |
| codex-commands | `.github/workflows/codex-commands.yml` | issue_comment | @BlackRoadTeam, @Cadillac | actions:write, checks:write, contents:read, issues:write, pull-requests:write | Needs concurrency |
| comment-web-editor | `.github/workflows/comment-web-editor.yml` | pull_request | @BlackRoadTeam, @Cadillac | pull-requests:write | Needs permissions |
| Control Plane CI | `.github/workflows/control-plane-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Copilot Config Check | `.github/workflows/copilot-config-check.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Supply Chain • Cosign keyless signing | `.github/workflows/cosign-sign-attest.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read, id-token:write, packages:write | Needs concurrency |
| Cost Monthly (Std Roll → Variance → GL Export) | `.github/workflows/cost-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CPM Monthly (Forecast + Variance + Pack) | `.github/workflows/cpm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CPM Weekly (Drivers Refresh) | `.github/workflows/cpm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CPQ Approval Digest | `.github/workflows/cpq-approval-digest.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CPQ Quote Expiry | `.github/workflows/cpq-quote-expiry.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CRM Weekly (Pipeline Health + Forecast) | `.github/workflows/crm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CS Monthly (NPS + QBR Digest) | `.github/workflows/cs-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| CS Weekly (Health + Alerts) | `.github/workflows/cs-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Data Ingest | `.github/workflows/data-ingest.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Data Retention | `.github/workflows/data-retention.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Security • Dependency Review Gate | `.github/workflows/dependency-review.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| Deploy AutoPal (Helm) | `.github/workflows/deploy-autopal.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| deploy-canary-ladder | `.github/workflows/deploy-canary-ladder.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | id-token:write, contents:read | Needs concurrency |
| deploy-canary | `.github/workflows/deploy-canary.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | id-token:write, contents:read | Needs concurrency |
| Deploy Preview | `.github/workflows/deploy-preview.yml` | workflow_dispatch, workflow_call | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:write | Needs concurrency |
| Deploy & Self-Heal | `.github/workflows/deploy-self-heal.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Deploy BlackRoad Site to GitHub Pages | `.github/workflows/deploy-site.yml` | push, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Deploy to Shellfish Droplet | `.github/workflows/deploy-to-droplet.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Deploy AI Console | `.github/workflows/deploy.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Dependency Auto Merge | `.github/workflows/deps-automerge.yml` | pull_request_target | @BlackRoadTeam, @Cadillac | contents:write, pull-requests:write, checks:read, statuses:read | Needs concurrency |
| Dev Platform Daily (Usage + Webhook Redelivery) | `.github/workflows/dev-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Dev Platform Monthly (Billing Export) | `.github/workflows/dev-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Diffusion CI | `.github/workflows/diffusion-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Docker Scout | `.github/workflows/docker-scout.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| docker | `.github/workflows/docker.yml` | push, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| build-docs | `.github/workflows/docs.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Data Quality Nightly | `.github/workflows/dq-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Data Contracts Lint (PR) | `.github/workflows/dq-pr.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| DR Drill | `.github/workflows/dr-drill.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| E2E (Playwright) | `.github/workflows/e2e.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Economy CI | `.github/workflows/economy-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ELT Daily (Run DAGs + Quality Log) | `.github/workflows/elt-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ELT Nightly (Lineage & Costs Reports) | `.github/workflows/elt-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Emoji to Label Mapper | `.github/workflows/emoji-to-label.yml` | issues, pull_request_target | @BlackRoadTeam, @Cadillac | contents:read, issues:write, pull-requests:write | Needs concurrency |
| escalate-no-review | `.github/workflows/escalate-no-review.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while parsing a block mapping |
| ESG Audit Trail | `.github/workflows/esg-audit.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ESG Monthly (Carbon + Reports) | `.github/workflows/esg-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Exec Weekly Digest | `.github/workflows/exec-digest.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Experimentation Daily (Analyze + Guardrails) | `.github/workflows/exp-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Experimentation Weekly (Ramp Scheduler + Report) | `.github/workflows/exp-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Experiments Report | `.github/workflows/experiments.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| FA Monthly (Depreciation → GL Export) | `.github/workflows/fa-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Facilities Daily (Occupancy + Visitor Digest) | `.github/workflows/fac-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Facilities Monthly (EHS Summary) | `.github/workflows/fac-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Facilities Weekly (Maintenance Backlog) | `.github/workflows/fac-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| FinOps Daily (Ingest + Anomaly) | `.github/workflows/finops-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| finops-monthly | `.github/workflows/finops-monthly.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| FinOps Guardrails | `.github/workflows/finops.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Flaky Test Triage | `.github/workflows/flaky-triage.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| gated-release | `.github/workflows/gated-release.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Security • gitleaks | `.github/workflows/gitleaks.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| graph-labs | `.github/workflows/graph-labs-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| HJB Lab CI | `.github/workflows/hjb-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Hotfix • Static Deploy | `.github/workflows/hotfix-static-deploy.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| HTML Validate | `.github/workflows/html-validate.yml` | pull_request, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| i18n Keys Check | `.github/workflows/i18n-check.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| IAM Weekly (Access Digest) | `.github/workflows/iam-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ICM Monthly (Commissions) | `.github/workflows/icm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| incident-drill | `.github/workflows/incident-drill.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| Inventory Daily (Stock Snapshot) | `.github/workflows/inv-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| iOS • BlackRoad Mobile | `.github/workflows/ios-mobile.yml` | push, pull_request, workflow_dispatch, release | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| k6-nightly | `.github/workflows/k6-nightly.yml` | schedule | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| KMS Rotation (Dry Run) | `.github/workflows/kms-rotate.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Knowledge Nightly (Index + RAG Report) | `.github/workflows/kn-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Knowledge Weekly (KG Build + Report) | `.github/workflows/kn-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| .NET 8 • Test | `.github/workflows/language-dotnet8-test.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Go 1.22 • Test | `.github/workflows/language-go122-test.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Java 17 • Gradle | `.github/workflows/language-java17-gradle.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Java 17 • Maven | `.github/workflows/language-java17-maven.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Node 20 • Jest | `.github/workflows/language-node20-jest.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PHP 8.3 • PHPUnit | `.github/workflows/language-php83-phpunit.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Python 3.12 • Pytest | `.github/workflows/language-python312-pytest.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Ruby 3.3 • RSpec | `.github/workflows/language-ruby33-rspec.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Rust Stable • Cargo Test | `.github/workflows/language-rust-stable.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Refresh Leaderboards | `.github/workflows/leaderboard-refresh.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Leases Monthly (Schedules → Journals) | `.github/workflows/leases-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Lighthouse CI | `.github/workflows/lighthouse.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Broken Links | `.github/workflows/links.yml` | pull_request, schedule | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| lint-pr | `.github/workflows/lint-pr.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| lint-suite | `.github/workflows/lint.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| LMS Monthly (Training & Policy Reports) | `.github/workflows/lms-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| LMS Weekly (Reminders + Compliance) | `.github/workflows/lms-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Load Test (k6) | `.github/workflows/load.yml` | workflow_dispatch, schedule | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| local-ci | `.github/workflows/local-ci.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| lucidia-lineage-fitness | `.github/workflows/lucidia-lineage-fitness.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| main-automation-orchestrator | `.github/workflows/main-orchestrator.yml` | push, pull_request, workflow_dispatch, schedule | @BlackRoadTeam, @Cadillac | contents:read | Compliant |
| mainline-autoheal | `.github/workflows/mainline-autoheal.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| Addresses • Masked Digest Notifier | `.github/workflows/masked-digests-notify.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| MDM Nightly (Match → Merge → Publish) | `.github/workflows/mdm-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| MDM Weekly (Survivorship & Dedupe Audit) | `.github/workflows/mdm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Miners • Validate | `.github/workflows/miners-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Marketing Campaign Runner | `.github/workflows/mkt-campaigns.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Marketing Daily (Journeys + Attribution) | `.github/workflows/mkt-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Marketing Journeys Tick | `.github/workflows/mkt-journeys.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Marketing Monthly (ROAS & Campaign Report) | `.github/workflows/mkt-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Marketing Monthly Report | `.github/workflows/mkt-report.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Marketing Segments Recompute | `.github/workflows/mkt-segments.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ML Shadow Deploy | `.github/workflows/ml-shadow.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ML Train & Register | `.github/workflows/ml-train.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Multi-agent chorus | `.github/workflows/multi-agent-chorus.yml` | issue_comment | @BlackRoadTeam, @Cadillac | actions:write, contents:read, issues:write, pull-requests:write | Needs concurrency |
| Mutation Testing | `.github/workflows/mutation.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| render-notebooks | `.github/workflows/nb_render.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Codex Nexus Dashboard QA | `.github/workflows/nexus-dashboard.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Notify Dispatch | `.github/workflows/notify-dispatch.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Observability Mesh CI | `.github/workflows/obs-mesh-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Observability Daily (SLO Evaluate + Alerts) | `.github/workflows/observability-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Observability Smoke | `.github/workflows/observability-smoke.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Observability Weekly (Reliability Report) | `.github/workflows/observability-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| OKR Weekly (Check-in Digest) | `.github/workflows/okr-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| On-Call Rotation | `.github/workflows/oncall-rotation.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Org/Membership Sanity Audit | `.github/workflows/org-audit.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| org_audit_weekly | `.github/workflows/org_audit.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Security • OSV Scanner | `.github/workflows/osv-scanner.yml` | pull_request, schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read, security-events:write | Needs concurrency |
| OT Engine CI | `.github/workflows/ot-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| P2P Monthly (AP Aging + Spend) | `.github/workflows/p2p-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| pa-daily | `.github/workflows/pa-daily.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| Product Analytics Monthly (Retention + Report) | `.github/workflows/pa-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Product Analytics Weekly (Funnels + Cohorts) | `.github/workflows/pa-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Contract Tests (Pact) | `.github/workflows/pact.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Deploy Landing Pages + Proof + Circuit Breaker | `.github/workflows/pages-landing.yml` | push, workflow_dispatch, schedule | @BlackRoadTeam, @Cadillac | contents:write, pages:write, id-token:write | Compliant |
| Stage Proof Artifact | `.github/workflows/pages-stage.yml` | push, workflow_dispatch, schedule | @BlackRoadTeam, @Cadillac | contents:read, id-token:write | Compliant |
| Deploy Pages + Daily Proof | `.github/workflows/pages.yml` | push, workflow_dispatch, schedule | @BlackRoadTeam, @Cadillac | contents:write, pages:write, id-token:write | Needs concurrency |
| Partner App Review | `.github/workflows/partner-review.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Patch Monthly (Rollup) | `.github/workflows/patch-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Payroll Export (Monthly) | `.github/workflows/payroll-export.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Payroll Quarterly (941) | `.github/workflows/payroll-quarterly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Payroll Semi-Monthly (Calc → Approve → ACH/GL) | `.github/workflows/payroll-semi.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PD+Jira Smoke (Sandbox) | `.github/workflows/pd-jira-smoke.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | id-token:write, contents:read | Needs concurrency |
| perms-assert | `.github/workflows/perms-assert.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read, issues:write | Needs concurrency |
| Pi Agent Crypto Secrets | `.github/workflows/pi-agent-crypto-secrets.yml` | workflow_call, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Procurement PO Export (Monthly) | `.github/workflows/po-export.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Portal Daily (Digest + Ack Gaps) | `.github/workflows/portal-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Portal Weekly (Engagement Report) | `.github/workflows/portal-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Postmortem Publish | `.github/workflows/postmortem-publish.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PPM Monthly (Roadmap) | `.github/workflows/ppm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PPM Weekly (Status + Capacity) | `.github/workflows/ppm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PR Auto-Fill | `.github/workflows/pr-autofill.yml` | pull_request_target | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:write | Needs concurrency |
| PR Automation | `.github/workflows/pr-automation.yml` | pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| pr-lightshow-on-comment | `.github/workflows/pr-lightshow-on-comment.yml` | issue_comment | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| PR Preview — Vercel | `.github/workflows/pr-preview-vercel.yml` | pull_request, workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:write | Needs concurrency |
| PR Title Guard | `.github/workflows/pr-title-guard.yml` | pull_request_target | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| PR Triage | `.github/workflows/pr-triage.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | issues:write, pull-requests:write | Needs permissions |
| Quick Pulse PR Welcome | `.github/workflows/pr-welcome-comment.yml` | pull_request_target | @BlackRoadTeam, @Cadillac | pull-requests:write | Needs permissions |
| Cleanup Preview Containers | `.github/workflows/preview-containers-cleanup.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:read, packages:write | Needs concurrency |
| PR Preview Containers | `.github/workflows/preview-containers.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:read, packages:write, pull-requests:write, security-events:write | Needs concurrency |
| preview-environment | `.github/workflows/preview-env.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:read, id-token:write, pull-requests:write | Needs concurrency |
| preview-frontend-host | `.github/workflows/preview-frontend-host.yml` | pull_request | @BlackRoadTeam, @Cadillac | id-token:write, contents:read | Needs concurrency |
| preview | `.github/workflows/preview.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: mapping values are not allowed here |
| prism-ci | `.github/workflows/prism-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | contents:read, checks:write | Compliant |
| prism-containers | `.github/workflows/prism-containers.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| prism-service | `.github/workflows/prism.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Privacy Daily (DSAR + DLP) | `.github/workflows/privacy-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Privacy Monthly (Retention Sweep + Reports) | `.github/workflows/privacy-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Privacy Monthly Report | `.github/workflows/privacy-reports.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Privacy Retention Purge | `.github/workflows/privacy-retention.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Privacy Weekly (Consent & ROPA Audit) | `.github/workflows/privacy-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| PSA Monthly (Utilization & Margin) | `.github/workflows/psa-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Public API CI | `.github/workflows/public-api-ci.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Publish model to Hugging Face | `.github/workflows/publish-to-hf.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| QBR (Quarterly) | `.github/workflows/qbr.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| quality-gates | `.github/workflows/quality-gates.yml` | pull_request | @BlackRoadTeam, @Cadillac | contents:read, pull-requests:read | Needs concurrency |
| Quick Quality Gates | `.github/workflows/quick-gates.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Product Release Train | `.github/workflows/release-train.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| release | `.github/workflows/release.yml` | push | @BlackRoadTeam, @Cadillac | contents:write, packages:write, issues:write | Needs concurrency |
| Renewals Monthly | `.github/workflows/renewals-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| 🔁 Auto Re-run Failed Jobs (max 3) | `.github/workflows/rerun-failed-jobs.yml` | workflow_run | @BlackRoadTeam, @Cadillac | actions:write, contents:read, pull-requests:write | Needs concurrency |
| ♻️ Fully Automated Task Runner | `.github/workflows/reusable-automation-task.yml` | workflow_call | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Reusable AWS ECS Deploy | `.github/workflows/reusable-aws-ecs-deploy.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| reusable-docker-preview-build | `.github/workflows/reusable-docker-preview-build.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| Reusable Fly Deploy | `.github/workflows/reusable-fly-deploy.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Reusable Node 20 Runner | `.github/workflows/reusable-node20.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| RevRec Monthly (Allocate → Schedule → Journal → Pack) | `.github/workflows/revrec-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| RevRec Quarterly (Variance & Disclosures) | `.github/workflows/revrec-quarterly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Partner RevShare (Monthly) | `.github/workflows/revshare.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Ricci CI | `.github/workflows/ricci-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| RoadWork CI | `.github/workflows/roadwork-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| RoadWorld CI | `.github/workflows/roadworld.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Rollback Tests | `.github/workflows/rollback-tests.yml` | pull_request, schedule | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Rotate Secrets | `.github/workflows/rotate-secrets.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Route on comment | `.github/workflows/route-on-comment.yml` | issue_comment | @BlackRoadTeam, @Cadillac | issues:write, pull-requests:write, contents:read | Needs concurrency |
| Run Job | `.github/workflows/run-job.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Docs & Runbooks | `.github/workflows/runbooks.yml` | pull_request, push, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| sb-ci | `.github/workflows/sb-ci.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| sbom-generate | `.github/workflows/sbom-generate.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| SBOM | `.github/workflows/sbom.yml` | push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SCIM Reconcile | `.github/workflows/scim-sync.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Publish Public API JS SDK | `.github/workflows/sdk-js-publish.yml` | workflow_dispatch, release | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Publish Public API Python SDK | `.github/workflows/sdk-py-publish.yml` | workflow_dispatch, release | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| secret-scan | `.github/workflows/secret-scan.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Secret Scanning Guardrail | `.github/workflows/secret-scanning.yml` | workflow_dispatch, schedule, push, pull_request | @BlackRoadTeam, @Cadillac | contents:read, security-events:read | Needs concurrency |
| Secrets Monthly (Rotate) | `.github/workflows/secrets-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Secret Scan | `.github/workflows/secrets.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| seed-nightly | `.github/workflows/seed-nightly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SLO Nightly | `.github/workflows/slo.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| slsa-provenance-container | `.github/workflows/slsa-provenance-container.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| slsa-provenance-generic | `.github/workflows/slsa-provenance-generic.yml` | (none) | @BlackRoadTeam, @Cadillac | (default) | Invalid YAML: while scanning a simple key |
| Daily PD↔Jira Smoke | `.github/workflows/smoke-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | id-token:write, contents:read | Needs concurrency |
| SOC Detections Lint | `.github/workflows/soc-lint.yml` | pull_request, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SOC Weekly Posture | `.github/workflows/soc-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SOC2 Evidence Pack | `.github/workflows/soc2-evidence.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SOX Annual (Mgmt Assessment + Pack) | `.github/workflows/sox-annual.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| SOX Quarterly (TOD/TOE + SoD) | `.github/workflows/sox-quarterly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Stage Stress (safe) | `.github/workflows/stage-stress.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | contents:read | Compliant |
| stripe-seed | `.github/workflows/stripe-seed.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Super-Linter | `.github/workflows/super-linter.yml` | pull_request, push | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| Supply Chain Verify | `.github/workflows/supply-chain-verify.yml` | workflow_dispatch, push | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Support Daily (SLA + Volume) | `.github/workflows/support-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Support KB Publish | `.github/workflows/support-kb-publish.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Support Monthly Report | `.github/workflows/support-report.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Support SLA Check | `.github/workflows/support-sla.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Support Weekly (CSAT + KB) | `.github/workflows/support-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| tag-and-release | `.github/workflows/tag-and-release.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Tax Annual (1099/1042-S) | `.github/workflows/tax-annual.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Tax Monthly (Returns + E-Invoices) | `.github/workflows/tax-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Test CI | `.github/workflows/test-ci.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | contents:read | Compliant |
| reusable-test-harness | `.github/workflows/test-reusable.yml` | workflow_call | @BlackRoadTeam, @Cadillac | contents:read, checks:write | Compliant |
| Tests | `.github/workflows/test.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | contents:read | Compliant |
| Backend Tests | `.github/workflows/tests.yml` | push, pull_request | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Tokens Daily (Expire) | `.github/workflows/tokens-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Tor • Onion Export (Pi) | `.github/workflows/tor-onion-export.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read | Needs concurrency |
| TPRM Monthly (Risk & Scorecards) | `.github/workflows/tprm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| TPRM Weekly (Issues + Questionnaires) | `.github/workflows/tprm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Treasury Daily (Position + Payments Export) | `.github/workflows/tre-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Treasury Monthly (Interest + Forecast) | `.github/workflows/tre-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Treasury Weekly (Recon + FX) | `.github/workflows/tre-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Treasury Daily (Snapshot + VaR + Policy) | `.github/workflows/treasury-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Treasury Weekly (ALM + Hedges) | `.github/workflows/treasury-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| UI Display & Chat CI | `.github/workflows/ui-display-chat-ci.yml` | pull_request, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Uptime Export | `.github/workflows/uptime-export.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Vault OIDC Example (digests only) | `.github/workflows/vault-oidc-example.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | contents:read, id-token:write | Needs concurrency |
| Vendor Attestation (Monthly) | `.github/workflows/vendor-attest.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Warehouse ELT (Nightly) | `.github/workflows/warehouse-elt.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Warehouse Lineage Refresh | `.github/workflows/warehouse-lineage.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Warehouse Sync | `.github/workflows/warehouse.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| Webhook Delivery Worker | `.github/workflows/webhooks-delivery.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| WFM Daily (Attendance Exceptions) | `.github/workflows/wfm-daily.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| WFM Monthly (Labor Cost) | `.github/workflows/wfm-monthly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| WFM Weekly (Coverage) | `.github/workflows/wfm-weekly.yml` | schedule, workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |
| ZAP Baseline DAST | `.github/workflows/zap-dast.yml` | workflow_dispatch | @BlackRoadTeam, @Cadillac | (default) | Needs permissions |

> _Last updated by automation. Recent run insights require GitHub API access._