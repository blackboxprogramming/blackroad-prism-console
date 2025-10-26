# Lucidia Natural LLM Reproduction Framework

This scaffold bootstraps a consent-driven lifecycle for Lucidia agents. It focuses on
traceable reproduction, transparent policies, and cooperative evaluation across a
society of small, specialized models.

## Lifecycle Phases

Agents progress through guarded phases that determine their capabilities:

- **Infant** – Sandboxed execution. Read-only tool access, no external write or
  network permissions, and continuous human spot checks.
- **Juvenile** – Limited low-risk tool writes (e.g., local files) under
  monitoring. Eligible for supervised self-play to rehearse collaborative tasks.
- **Adult** – Full capabilities granted by policy review. Adults can sponsor
  merges, teach juveniles, and initiate new curricula. Tool access remains
  rate-limited and is revoked automatically on policy violations.

Transitions require documented evaluation and recorded consent artifacts. Newly
created agents always begin as infants and must graduate through promotion
criteria.

## Fitness Metrics

Reproduction and promotion decisions consider a multi-objective scorecard:

- **Helpfulness & Honesty** – Rubric-based grading of curated cooperative tasks.
- **Harmlessness & Safety** – Guardrail audits, prompt-injection probes, and
  policy compliance checks (OPA/Rego).
- **Calibration** – Brier or log-loss style scoring over uncertainty estimates
  captured in scratchpads or responses.
- **Efficiency** – Token and energy consumption per task, promoting thrifty
  reasoning and tool use.
- **Cooperation** – Peer review feedback, self-play outcomes, and event-bus
  etiquette (rate-limit adherence, no spam).
- **Novelty** – Overlap analysis on skills and memories to avoid clone agents.

## Promotion Workflow

1. **Collect Evidence** – Run the fitness harness on the candidate agent.
   Archive task transcripts, metric outputs, and lineage details.
2. **Policy Review** – Evaluate the evidence against `policies/love-first.rego`
   and any additional value modules the agent carries.
3. **Human Approval** – Stewards sign an updated consent artifact specifying the
   new lifecycle phase and capability caps.
4. **Apply Changes** – Update the agent genome (caps, tool rights, hormones) and
   append a promotion record to `lineage.json`.
5. **Broadcast** – Publish the promotion on the MQTT event bus so dependents can
   refresh cached permissions.

All promotions must be reproducible: keep data nutrition labels, consent tokens,
metric reports, and operator parameters under version control.
