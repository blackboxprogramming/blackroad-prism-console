# Hugging Face Space Automation Plan

## Selected Space
- **Space name**: `blackroad/prism-console-agents`
- **Template**: Duplicate the official Hugging Face agent template Space as the baseline deployment. This keeps the smolagents wiring and UI scaffolding provided by Hugging Face while letting us swap in BlackRoad-specific tools and branding.

## Initial Objectives
1. **MCP server + webhook listener**
   - Implement the Model Context Protocol (MCP) server that mirrors the existing PR Autopilot workflow.
   - Deploy a lightweight FastAPI (or similar) webhook listener inside the Space to capture GitHub `pull_request` and `issue_comment` events.
   - Forward validated events to the MCP server, mapping to the `@codex fix comments` trigger described in `README_PR_AUTOMATION.md`.
2. **Agent roster bootstrapping**
   - Start with the 78 personas already codified in `modules/mega_agents.js` and the novelty agents under `prism/agents/novelty/`.
   - Package each persona as a smolagents-compatible manifest so they can be toggled on/off per workflow.
3. **Observability + guardrails**
   - Pipe command logs to the Space storage volume (mirroring `data/agents/{queue,results}.jsonl`).
   - Enforce approvals for sensitive intents (deploy, schema:migrate, rotate:secrets) by requiring explicit maintainer confirmation before executing those commands.

## Scaling Path to 200 Agents
We will reach the requested 200-agent roster in three phases:

1. **Phase 1 – Core deployment (≈80 agents)**
   - Deploy the current core + novelty agents.
   - Validate end-to-end GitHub PR automation via the Space.
2. **Phase 2 – Expansion packs (≈60 additional agents)**
   - Extend `modules/mega_agents.js` with new specialized personas (e.g., sustainability, compliance, supply-chain, resilience).
   - Author manifests and test runs for each pack before enabling them in production.
3. **Phase 3 – Custom partnerships (final ≈60 agents)**
   - Co-design remaining personas (e.g., Lucidia, Alice, Cadillac, Cecilia, Roadie, Silas, Oloh, Holo, Liora) with domain leads.
   - Add integration-specific tooling (Slack, Asana, Snowflake, etc.) per agent, ensuring connectors respect least-privilege scopes.

## Next Actions
- [ ] Duplicate the agent template Space under the `blackroad` org with the name above.
- [ ] Create GitHub webhooks (PR + issue comment) pointing to the Space’s public endpoint.
- [ ] Port the MCP server + queue logic from `docs/agents.md` into the Space backend.
- [ ] Import agent manifests and validate that queued commands execute end-to-end.
- [ ] Draft expansion-pack manifests to begin the Phase 2 ramp.
