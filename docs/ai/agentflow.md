# AgentFlow Overview

AgentFlow is a modular agentic architecture that distributes live problem solving across four cooperating modules — Planner, Executor, Verifier, and Generator — while sharing a unified memory and toolset. This design replaces a single monolithic policy with specialized roles that coordinate during interactive sessions to plan, act, and validate tool-augmented reasoning.

## In-the-Flow Planning
- **Flow-trained Planner:** Unlike offline-only planners, AgentFlow optimizes its Planner while the multi-turn dialogue unfolds, allowing it to adapt plans based on real-time feedback and tool outcomes.
- **Flow-GRPO Objective:** Flow-based Group Refined Policy Optimization (Flow-GRPO) broadcasts trajectory-level rewards back to each conversational turn, applying PPO-style updates with KL regularization so the Planner remains stable while learning from long-horizon credit assignment.

## Execution Modules
- **Executor:** Invokes tools or external APIs according to the Planner's directives, ensuring actions are grounded in available capabilities.
- **Verifier:** Audits intermediate and final results, improving robustness by catching tool or reasoning errors before responses reach the user.
- **Generator:** Produces user-facing replies that blend planned outcomes with verified tool outputs for clarity and completeness.

## Performance Highlights
- Demonstrated roughly 14–15% accuracy gains over contemporary baselines on benchmarks spanning search, mathematical reasoning, and scientific reasoning tasks when using 7B-parameter backbones.
- Competitive with substantially larger models (e.g., GPT-4o-class systems) on several evaluated tasks due to improved planning fidelity and tool utilization.

## Practical Impact
By optimizing the Planner in the live loop and pairing it with dedicated execution, verification, and generation roles, AgentFlow narrows the gap between research prototypes and production-ready agents that must operate reliably against real-world APIs and systems.
