"""Simple scenario simulator."""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any, Dict, List

from bots.simple import get_default_bots
from config.settings import settings
from orchestrator.logging import generate_trace_id, logger


@dataclass
class Scenario:
    id: str
    name: str
    params: Dict[str, Any]
    steps: List[Dict[str, Any]]


def run_scenario(s: Scenario) -> Dict[str, Any]:
    random.seed(settings.RANDOM_SEED)
    bots = get_default_bots()
    results = []
    trace_id = generate_trace_id()
    for step in s.steps:
        bot = bots[step["name"]]
        output = bot.run(step["intent"], step.get("inputs", {}))
        results.append({"bot": bot.name, "output": output})
    summary = {
        "id": s.id,
        "name": s.name,
        "params": s.params,
        "steps": results,
        "trace_id": trace_id,
    }
    logger.log("scenario complete", trace_id=trace_id, scenario=s.id)
    return summary
