# Next Platform Investment: Unified Control Plane

## Why Platform Consolidation Now
- **Signal overload**: With CI, release pipelines, observability, and security guardrails live, teams are jumping between tools to complete a single workflow. Fragmentation is already a productivity drag and will grow as adoption expands.
- **Decision latency**: Incident and release decisions rely on correlating data across chatops, deploy targets, and policy systems. A single control plane gives leads a shared source of truth.
- **Governance runway**: Before layering on additional compliance requirements, establish the surfaces (APIs, RBAC, audit events) that governance will later consume.

## Vision
Deliver a "BlackRoad Control Plane" that stitches together the existing production toolchain—CLI-first with an optional web portal—for:
- Environment-aware deploy orchestration across AWS, GCP, Kubernetes, Render, and Fly
- Standardized release promotion and preview lifecycle management
- Operational guardrails surfaced as policy checks and ready-made runbooks
- Extensible plugin model so future governance and developer-experience work can live in the same interface

## Guiding Principles
1. **Single source of truth** for service topology, environments, and workflow status.
2. **Workflow-centric UX**: start from the job to be done (ship, respond, observe) and compose underlying services.
3. **APIs first**: every capability exposed through typed APIs/SDK so chatops and future automation stay in sync.
4. **Progressive adoption**: no big-bang migration; wrap existing lanes and let teams opt in incrementally.

## 90-Day Roadmap
| Phase | Duration | Outcomes |
| --- | --- | --- |
| Discovery & Architecture | Weeks 1-3 | Inventory existing workflow touchpoints, define domain model (service, environment, workflow), select core stack (likely TypeScript CLI + GraphQL gateway). |
| Control Plane Foundations | Weeks 4-8 | Stand up identity & auth (SAML/OIDC + service tokens), implement service catalog API, wire deploy + release orchestration via adapters, surface status dashboard. |
| Operator Workflows | Weeks 9-12 | Add incident response integration (pagings, runbooks), unify audit log streams, deliver first-class CLI commands for deploy, release promotion, and incident review. |

## Dependencies & Interfaces
- **Identity**: integrate with existing IAM to reuse roles and SSO groups.
- **Telemetry bus**: consume observability and security events via shared event mesh; define schema contracts.
- **Infrastructure adapters**: wrap current deployment scripts for AWS/GCP/K8s/Render/Fly behind a common interface.
- **Policy hooks**: expose lifecycle hooks so governance tooling can subscribe without blocking day one.

## Success Metrics
- 30% reduction in time from merge to production release across top services.
- 80% of incident commanders using the control plane for status within first month of launch.
- 90% of deploy actions executed via CLI or portal rather than bespoke scripts.

## Immediate Next Steps
1. Run stakeholder interviews with release, SRE, and security leads to validate workflow priorities.
2. Draft domain model RFC and circulate for feedback.
3. Prototype service catalog schema and CLI scaffolding in a spike branch.

## Looking Ahead
Once the control plane is established, layer in governance policy packs, automated evidence collection, and developer ergonomics features (repo bootstrap, workflow updates) as plugins. This keeps the surface area coherent while still enabling the additional investments you outlined.
