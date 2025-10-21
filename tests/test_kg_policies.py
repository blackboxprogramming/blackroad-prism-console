import shutil

import pytest

from kg.chainer import PlanStep, execute_plan
from kg.model import KG_ARTIFACTS, KnowledgeGraph
from kg.provenance import capture_event
from kg.rules import run_rules


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def test_policy_blocks_release():
    reset()
    capture_event({"type": "artifact", "id": "A1", "bot": "Treasury-BOT", "path": "p"})
    capture_event({"type": "decision", "id": "D1", "artifact_id": "A1", "risk": "high"})
    run_rules("configs/kg_rules.yaml")
    kg = KnowledgeGraph()
    kg.add_node("S1", "Service", name="CoreAPI")
    plan = [
        PlanStep(
            bot="Change/Release-BOT",
            intent="release_checklist",
            input_selector='MATCH (s:Service) WHERE s.name="CoreAPI" RETURN s.name',
        ),
    ]
    with pytest.raises(RuntimeError):
        execute_plan(plan)
