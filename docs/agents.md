# Agents

The research pipeline relies on lightweight agents to orchestrate analyses and data generation.

* Agents trigger the scripts in `analysis/` to regenerate figures as needed.
* Each agent has a narrow responsibility and communicates through the filesystem.
* See `agents/` for implementation details.

