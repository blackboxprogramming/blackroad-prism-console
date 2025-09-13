import shutil

from kg.chainer import PlanStep, execute_plan
from kg.model import KG_ARTIFACTS, KnowledgeGraph


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def test_chain_edges():
    reset()
    kg = KnowledgeGraph()
    kg.add_node("S1", "Service", name="CoreAPI")
    plan = [
        PlanStep(
            bot="SRE-BOT",
            intent="error_budget",
            input_selector='MATCH (s:Service) WHERE s.name="CoreAPI" RETURN s.name',
        ),
        PlanStep(
            bot="Change/Release-BOT",
            intent="release_checklist",
            input_selector='MATCH (a:Artifact)-[:PRODUCED_BY]->(b:Bot[name="SRE-BOT"]) RETURN a.id',
        ),
    ]
    execute_plan(plan)
    kg = KnowledgeGraph()
    arts = [n for n, d in kg.nodes.items() if d["label"] == "Artifact"]
    assert len(arts) == 2
    assert kg.neighbors(arts[1], "DERIVED_FROM") == [arts[0]]
