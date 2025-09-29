# Data Commons MCP Integration Guide

## Overview
- **Service**: Google Data Commons exposes a public knowledge graph containing census, economic, health, and other civic datasets.
- **New capability**: The Data Commons team now ships a Model Context Protocol (MCP) server so AI agents can issue structured queries without juggling multiple bespoke APIs.
- **Why it matters**: Direct, protocol-driven access lets agents ground answers in verifiable statistics, accelerating prototyping of data-informed copilots and reducing hallucination risks when citing public metrics.

## Getting Started
1. **Install the MCP client package**
   ```bash
   pip install datacommons-mcp
   ```
2. **Authenticate via Gemini CLI (optional)**
   - Run `gemini login` if you plan to connect through the Gemini CLI experience.
   - Register the Data Commons MCP server as a tool source: `gemini mcp sources add datacommons`.
3. **Use within an ADK workflow (optional)**
   - Add `datacommons-mcp` to your workflow dependencies.
   - Reference the MCP server in your agent configuration so steps can call Data Commons endpoints.

## Example Python Session
```python
from datacommons_mcp import DataCommonsClient

client = DataCommonsClient()

response = client.query_stat_series("geoId/0644000", "Count_Person")
print(response.points[-5:])
```
- The client manages the MCP handshake and returns structured results (e.g., time series for a city population).
- Replace the DCIDs and statistical variables per your scenario; exploratory queries can reveal available dimensions.

## Operational Considerations
- **Scope & latency**: Broad statistical pulls may incur noticeable latency; cache repeat lookups and right-size queries when orchestrating autonomous agents.
- **Security posture**: Treat MCP servers as remote tools—apply allowlists, monitor tool invocations, and audit prompts to avoid preference manipulation or tool-hijacking attacks highlighted in recent MCP security research.
- **Governance**: Enforce principle-of-least-privilege when surfacing the server to multi-tenant assistants. Document data lineage so downstream outputs remain auditable.

## Next Steps
- Prototype an internal analytics agent that cross-checks metrics against Data Commons before publishing dashboards.
- Evaluate alignment guardrails (prompt scanners, response validators) alongside MCP usage to mitigate injection attempts.
- Contribute feedback upstream on latency bottlenecks or missing datasets so future protocol revisions can address them.
