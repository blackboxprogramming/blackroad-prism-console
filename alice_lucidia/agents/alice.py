"""Alice planner/critic agent implementation."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import torch


@dataclass
class PlanStep:
    description: str
    tool: str


@dataclass
class PlanResult:
    goal: str
    steps: List[PlanStep]
    critique: str
    outputs: Dict[str, str]


class AliceAgent:
    """Planner that decomposes goals and co-ordinates with Lucidia."""

    def __init__(self, tools: Dict[str, object]) -> None:
        self.tools = tools
        self._generation_steer: Optional[torch.Tensor] = None

    def set_generation_steer(self, steer: Optional[torch.Tensor]) -> None:
        self._generation_steer = steer

    def plan(self, goal: str) -> List[PlanStep]:
        steps: List[PlanStep] = []
        if any(token in goal.lower() for token in ["source", "fact", "data"]):
            steps.append(PlanStep(description="Fetch supporting knowledge", tool="retrieve"))
        steps.append(PlanStep(description="Draft answer", tool="generate"))
        if "what if" in goal.lower():
            steps.append(PlanStep(description="Simulate hypothetical", tool="simulate"))
        return steps

    def execute(self, goal: str) -> PlanResult:
        steps = self.plan(goal)
        outputs: Dict[str, str] = {}
        critique_lines: List[str] = []
        for step in steps:
            tool = self.tools[step.tool]
            if step.tool == "retrieve":
                results = tool(goal)  # type: ignore[call-arg]
                text = "; ".join(result.text for result in results) or "No memory found"
                outputs[step.description] = text
                critique_lines.append(f"Retrieved {len(results)} memories.")
            elif step.tool == "generate":
                steer_vector = self._generation_steer
                if "Fetch supporting knowledge" in outputs and not steer_vector is None:
                    steer_vector = steer_vector + torch.tensor(
                        [float(len(outputs["Fetch supporting knowledge"]))], dtype=torch.float32
                    )
                text = tool(goal, steer=steer_vector)  # type: ignore[call-arg]
                outputs[step.description] = text
                critique_lines.append("Draft created; verifying constraints.")
            elif step.tool == "simulate":
                prior = torch.randn(1, 4)
                target = torch.randn(1, 4)
                path = tool(prior, target)  # type: ignore[call-arg]
                outputs[step.description] = f"Bridge length={path.size(0)}"
                critique_lines.append("Simulation completed for scenario analysis.")
        critique = " ".join(critique_lines) if critique_lines else "No actions executed."
        return PlanResult(goal=goal, steps=steps, critique=critique, outputs=outputs)


__all__ = ["AliceAgent", "PlanStep", "PlanResult"]
