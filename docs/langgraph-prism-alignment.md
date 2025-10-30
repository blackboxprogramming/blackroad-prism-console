# LangGraph & CrewAI Landscape vs. Prism Console Agent Mesh

## Overview
This note captures the most relevant developments in LangGraph, LangGraph Cloud/Studio, and CrewAI, and sketches how they intersect with the Prism Console agent plan (Lucidia, Cadillac, Felix). The focus is on leverage points, risks, and decision prompts for near-term roadmap discussions.

## LangGraph & CrewAI Highlights
- **Managed runtime (LangGraph Cloud) and Studio debugging** – hosted execution with scaling primitives (queues, concurrency controls, background/cron jobs) plus an interactive timeline to inspect/patch agent state.
- **Node/task caching** – avoids redundant execution inside a graph by memoising node results when state and inputs match.
- **Template & low-code tooling** – pre-built blueprints for common orchestration topologies and a drag-and-drop builder (Open Agent Platform) that generates LangGraph projects.
- **Hybrid orchestration** – community experiments where CrewAI agents run under LangGraph routing, combining CrewAI's simpler agent primitives with LangGraph's richer control flow.
- **State resilience** – checkpointing and resumability improvements targeting long-running workflows with human-in-the-loop oversight.
- **Ecosystem signals** – demand for API stabilisation, clearer docs, and reduction of breaking changes prior to a 1.0 line.

## Alignment with Prism Console Agents
### Lucidia (symbolic core & orchestration)
- **Leverage**: LangGraph's persistence primitives are a direct fit for Lucidia's need to checkpoint symbolic state across long episodes. Node caching aligns with Lucidia's contradiction-aware policy checks, letting Lucidia short-circuit repeated validations.
- **Risks**: LangGraph Cloud is still beta; Lucidia's trust and sovereignty requirements may preclude managed runtimes. API churn could destabilise integrations with Lucidia's Ψ′ Codex unless we isolate adapters or pin versions.
- **Action prompts**:
  - Prototype Lucidia's memory checkpoints atop LangGraph's persistence layer in a self-hosted deployment.
  - Build an adapter abstraction so Lucidia can swap orchestration backends (LangGraph vs. in-house) if APIs shift.

### Cadillac (conversational/experience layer)
- **Leverage**: Low-code templates can bootstrap Cadillac-specific agent flows (e.g., scripted conversation starters) for rapid experiments. Studio's breakpoint tooling can help designers iterate on Cadillac's persona and guardrails without redeploying code.
- **Risks**: Templates skew toward generic use cases; Cadillac's bespoke narrative logic likely needs deeper customisation than the visual builder supports. Studio currently focuses on developer users; design teams may still require bespoke tooling.
- **Action prompts**:
  - Use templates as scaffolding for Cadillac prototypes, then migrate to code for production fidelity.
  - Evaluate whether Studio sessions can export traces that Cadillac's UX review loop can ingest.

### Felix (ops/automation agent)
- **Leverage**: LangGraph's cron/background execution and CrewAI's task hand-off primitives align with Felix's scheduled maintenance jobs and escalation workflows. Hybrid CrewAI+LangGraph routing may let Felix delegate specialised tasks to CrewAI crews while Lucidia retains oversight.
- **Risks**: CrewAI's expressivity limitations could constrain complex Felix playbooks; mixing frameworks increases surface area for bugs. Monitoring parity between LangGraph Cloud and on-prem stacks remains immature.
- **Action prompts**:
  - Pilot a Felix maintenance scenario using LangGraph background jobs with checkpoints to validate recovery semantics.
  - Define observability requirements (metrics, trace fidelity) before committing to managed runtimes.

## Cross-Cutting Considerations
- **Caching & continuity**: Adopt caching cautiously—verify deterministic behaviour in symbolic steps to avoid stale or incorrect policy decisions.
- **API stability**: Establish conformance tests around Lucidia/Cadillac/Felix interfaces so upstream changes in LangGraph or CrewAI surface quickly.
- **Governance & sovereignty**: Managed offerings accelerate experimentation but challenge the project's custodianship commitments; prioritise self-hosted parity.
- **Roadmap watchlist**: Track LangGraph's march toward a stable v1, especially around state persistence and graph editing APIs, before locking in deep dependencies.

## Next Steps
1. Schedule a spike to validate LangGraph's checkpointing with Lucidia's memory decay model.
2. Draft adapter interfaces for agent orchestration, supporting LangGraph, CrewAI, or native orchestrators.
3. Run a Felix maintenance drill using LangGraph cron jobs, documenting recovery from forced failures.
4. Collect UX requirements from Cadillac stakeholders to assess whether Studio traces meet review needs.
