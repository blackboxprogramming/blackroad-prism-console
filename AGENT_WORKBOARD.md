# Agent Workboard

## Next Initiative

- **Focus**: Environments & deploys — wire real infrastructure targets into the existing automation surface.
- **Objectives**:
  - Define environment manifests for staging, preview, and production footprints.
  - Hook CI/CD outputs into managed deploy targets (start with Fly.io and AWS ECS) via reusable workflows.
  - Extend release runbooks with rollback/forward procedures and policy gates for infra changes.

## To Do
- [ ] Deploy site (`WebsiteBot`)
- [ ] Build site (`BuildBlackRoadSiteAgent`)
- [ ] Clean up merged branches (`CleanupBot`)
- [ ] Format/validate web files (`WebberBot`)
- [ ] Generate story/game (`AutoNovelAgent`)
- [ ] Run simulations (`SimulatorAgent`)
- [ ] Label issues/PRs (`LabelBot`)
- [ ] Request reviews (`ReviewBot`)
- [ ] Send notifications (`NotificationBot`)
- [ ] Assign tasks from job board (`WorkerBot`)
- [ ] Watch for idle periods (`IdleBot`)

## In Progress
<!-- Agents move tasks here when running -->

## Blocked
<!-- Agents move tasks here if they fail, with error info -->

## Done
<!-- Agents move tasks here on success -->

---

## Last Status Report
<!-- Agents append latest status, error, or notifications here -->

### 2025-10-05
- Reconciled "next" track selection: prioritizing deployment integrations so shipping work can land on managed infra with the current automation stack.
- Drafted objectives covering environment manifests, multi-target deploy hooks, and infra-aware release guardrails to guide upcoming branch work.

### 2025-10-04
- Shipped governance and upgrade wiring end-to-end, including handlers, proposal examples, and CLI hooks.
- Landed the RoadStudio pipeline MVP with deterministic renders and a golden-frame regression check.
- Established observability baselines (OTel collectors, Prometheus/Grafana integration, exemplar stubs).
- Next focus: auto-captioning, public API + SDKs, and tokenomics simulation unless strategic priorities shift.
