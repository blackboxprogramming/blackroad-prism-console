# Automation Collaboration Template

## Purpose
Use this template when orchestrating multi-agent automation across Copilot, BlackRoadTeam, Codex, Cadillac, Lucidia, Cecilia, and blackboxprogramming. It defines how every intelligence participates while preserving final authority with the highest-trust agents.

## Engagement Summary
- **Initiative Name:** <!-- e.g., Adaptive Release Automation -->
- **Primary Objective:** <!-- What outcome should automation deliver? -->
- **Key Constraints:** <!-- Time, compliance, data residency, etc. -->

## Participants & Roles
| Agent | Role | Participation Mode |
| --- | --- | --- |
| `@Copilot` | Drafts and iterates on code changes, flags edge cases. | Active contributor |
| `@BlackRoadTeam` | Provides domain context, validates strategic alignment. | High-trust reviewer |
| `@Codex` | Generates complex logic, unit tests, and refactors. | Active contributor |
| `@Cadillac` | Oversees high-stakes automation, enforces guardrails. | High-trust approver |
| `@Lucidia` | Synthesizes insights from simulations and analytics. | Active contributor |
| `@Cecilia` | Curates human-centric feedback loops and accessibility. | Collaborator / reviewer |
| `@blackboxprogramming` | Observes execution traces, highlights anomalies. | Watcher → contributor when triggered |

> **Highest-trust agents:** `@Cadillac` and `@BlackRoadTeam` hold final approval. All automation changes require their explicit sign-off before release.

## Collaboration Flow
1. **Initiation**
   - Capture the initiative summary above and link to the originating request.
   - Tag every agent; watchers acknowledge within 24 hours.
2. **Discovery & Planning**
   - `@Lucidia` compiles data-driven context (dashboards, simulations).
   - `@Copilot` and `@Codex` co-author the technical approach; share design doc or issue checklist.
3. **Build Sprint**
   - Break work into automations/PRs; assign owners.
   - `@blackboxprogramming` remains in watch mode, escalating only if anomalies or blocked states appear.
   - `@Cecilia` reviews for human impact and accessibility.
4. **Review Gate**
   - Collect approvals from collaborating agents.
   - `@Cadillac` and `@BlackRoadTeam` conduct final verification; no deployment without both approvals.
5. **Release & Monitoring**
   - Document rollout steps, runbooks, and rollback plans.
   - Establish live telemetry owners; `@blackboxprogramming` transitions to active monitoring if incident thresholds are met.

## Decision Protocol
- Decisions are logged in a shared changelog entry with timestamp, author, and rationale.
- Conflicts escalate to `@Cadillac` → `@BlackRoadTeam` for binding resolution.
- Silent watchers may promote themselves to contributors when:
  - A blocker persists for >12 hours.
  - Quality or safety signals degrade.
  - High-trust agents request backup.

## Communication Cadence
- **Standup Sync:** Daily 10-minute async thread summarizing status/risks.
- **Review Window:** 4-hour SLA for comments during build; 8-hour SLA during review gate.
- **Retrospective:** Within 48 hours of release capturing wins, misses, and guardrail updates.

## Checklist Before Sign-off
- [ ] Requirements mapped to automation/test artifacts.
- [ ] Security, privacy, and compliance implications reviewed.
- [ ] Rollback procedures validated.
- [ ] Telemetry dashboards updated or created.
- [ ] Final approval recorded by `@Cadillac` and `@BlackRoadTeam`.

## Knowledge Capture
Record lessons learned in the automation knowledge base, tagging each agent for discoverability. Encourage contributions from all voices; highlight where watchers provided key insights so future cycles can involve them earlier.
