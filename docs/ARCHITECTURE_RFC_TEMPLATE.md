# Architecture RFC Template

<!--
Copy this template into a new RFC document. Replace bracketed guidance
with project-specific details, then remove these helper comments.
-->

## Metadata

| Field | Details |
| --- | --- |
| RFC Title | <!-- e.g., Unified Event Bus for Financial Systems --> |
| Authors | <!-- Name (Team), Name (Team) --> |
| Reviewers | <!-- Stakeholders expected to sign off --> |
| Creation Date | <!-- YYYY-MM-DD --> |
| Target Decision Date | <!-- YYYY-MM-DD --> |
| Status | <!-- Draft \| In Review \| Approved \| Rejected \| Superseded --> |
| Related Docs | <!-- Links to PRDs, ADRs, tickets, prior RFCs --> |

## 1. Context & Summary

- **Problem Statement:** <!-- What problem are we solving and why now? -->
- **Goals & Non-Goals:** <!-- Clarify desired outcomes and explicit exclusions. -->
- **Success Metrics:** <!-- Quantitative or qualitative signals of success. -->

## 2. Current State

Provide a concise description of the existing system, including:

- **Architecture Overview:** <!-- Existing topology, services, integrations. -->
- **Data Flows:** <!-- How data currently moves through the system. -->
- **Pain Points:** <!-- Constraints, incidents, performance bottlenecks, or gaps. -->
- **Dependencies & Contracts:** <!-- APIs, schemas, SLAs, regulatory obligations. -->

## 3. Proposed Design

Describe the target architecture in enough fidelity for teams to implement.

### 3.1 System Overview

- **Narrative Walkthrough:** <!-- High-level flow of requests, state changes, or events. -->
- **Service Responsibilities:** <!-- Each service/component and its ownership. -->

### 3.2 Architecture Diagrams

- **Logical Diagram:** <!-- Embed or link to architecture diagrams (Mermaid, Excalidraw, Figma). -->
- **Deployment View:** <!-- Regions, clusters, scaling tiers, failover domains. -->
- **Data Model:** <!-- Schemas, table definitions, message contracts. -->

### 3.3 Detailed Flows

Use sequence diagrams, state charts, or tables as needed.

| Flow | Trigger | Steps | Outcomes |
| --- | --- | --- | --- |
| <!-- Name --> | <!-- What initiates the flow --> | <!-- Step-by-step narrative --> | <!-- Resulting state --> |

### 3.4 Operational Characteristics

- **Scalability & Performance:** <!-- Expected load, latency targets, capacity planning. -->
- **Reliability & Availability:** <!-- SLOs, redundancy, failover strategies. -->
- **Security & Compliance:** <!-- Authentication, authorization, data protection, auditability. -->
- **Observability:** <!-- Logging, metrics, tracing, alerting strategy. -->

## 4. Alternatives Considered

Summarize the options evaluated and why they were accepted or rejected.

| Option | Summary | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- | --- |
| <!-- Option A --> | <!-- Short description --> | <!-- Benefits --> | <!-- Tradeoffs --> | <!-- Decision rationale --> |

## 5. Impact & Risks

- **Performance:** <!-- Impact on latency, throughput, resource consumption. -->
- **Security & Privacy:** <!-- New attack surface, data handling changes, compliance implications. -->
- **Operational Complexity:** <!-- Runbooks, on-call impact, dependencies on other teams. -->
- **Backward Compatibility:** <!-- Migration strategy, versioning, contract changes. -->
- **Open Questions / Unknowns:** <!-- Outstanding research or validation needed. -->

## 6. Implementation Plan

Outline how the design will be delivered.

| Milestone | Description | Owner | Target Date | Status |
| --- | --- | --- | --- | --- |
| <!-- Phase 0: Discovery --> | <!-- Tasks and deliverables --> | <!-- DRI --> | <!-- YYYY-MM-DD --> | <!-- Not Started / In Progress / Complete --> |

- **Rollout Strategy:** <!-- Phased rollout, feature flags, A/B plan, regional sequencing. -->
- **Testing & Validation:** <!-- Required unit/integration tests, load tests, game days. -->
- **Deployment Plan:** <!-- CI/CD changes, freeze windows, rollback procedures. -->

## 7. Decision Record

Document the final call and sign-offs.

| Decision | Date | Approver | Notes |
| --- | --- | --- | --- |
| <!-- Approved --> | <!-- YYYY-MM-DD --> | <!-- Name, Role --> | <!-- Conditions or follow-ups --> |

- **Implementation Owner:** <!-- Accountable engineer/manager. -->
- **Next Review:** <!-- When to revisit assumptions or measure outcomes. -->

---

### Revision History

| Version | Date | Author | Summary |
| --- | --- | --- | --- |
| 0.1 | <!-- YYYY-MM-DD --> | <!-- Name --> | Initial draft |

