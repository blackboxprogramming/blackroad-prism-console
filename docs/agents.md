# Agents

The research pipeline relies on lightweight agents to orchestrate analyses and data generation.

* Agents trigger the scripts in `analysis/` to regenerate figures as needed.
* Each agent has a narrow responsibility and communicates through the filesystem.
* See `agents/` for implementation details.

## Athena Orchestrator

Athena coordinates the higher-level automation loop. It sequentially invokes the
build, deploy, and cleanup agents, updating `AGENT_WORKBOARD.md` after each step
so contributors can inspect the shared task board during long-running jobs.
Because the orchestrator intentionally keeps its coordination logic minimal, new
agents or alternative execution orders can be added without overhauling the
entry point.

