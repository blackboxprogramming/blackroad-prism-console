import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import typer
import yaml

from bots import available_bots
from kg.chainer import PlanStep, execute_plan
from kg.model import KnowledgeGraph
from kg.provenance import capture_event
from kg.query import run as kql_run
from kg.rules import run_rules
from orchestrator import orchestrator
from orchestrator.protocols import Task
from tools import storage

app = typer.Typer()

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"


def _next_task_id() -> str:
    counter_path = ARTIFACTS / "last_task_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    storage.write(str(counter_path), str(new))
    return f"T{new:04d}"


@app.command("task:create")
def task_create(
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    ctx = json.loads(storage.read(str(context))) if context else None
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=ctx, created_at=datetime.utcnow())
    storage.write(str(ARTIFACTS / task_id / "task.json"), task.model_dump(mode="json"))
    capture_event({"type": "task", "id": task_id, "goal": goal})
    typer.echo(task_id)


@app.command("task:route")
def task_route(
    id: str = typer.Option(..., "--id"),
    bot: str = typer.Option(..., "--bot"),
):
    task_data = json.loads(storage.read(str(ARTIFACTS / id / "task.json")))
    task = Task(**task_data)
    response = orchestrator.route(task, bot)
    storage.write(str(ARTIFACTS / id / "response.json"), response.model_dump(mode="json"))
    capture_event(
        {
            "type": "artifact",
            "task_id": id,
            "bot": bot,
            "path": str(ARTIFACTS / id / "response.json"),
            "intent": task.goal,
            "artifact_type": "response",
        }
    )
    typer.echo(response.summary)


@app.command("task:status")
def task_status(id: str = typer.Option(..., "--id")):
    resp_path = ARTIFACTS / id / "response.json"
    if not resp_path.exists():
        typer.echo("No response")
        raise typer.Exit(code=1)
    data = json.loads(storage.read(str(resp_path)))
    typer.echo(f"Summary: {data.get('summary')}")
    typer.echo("Next actions:")
    for act in data.get("next_actions", []):
        typer.echo(f"- {act}")


@app.command("bot:list")
def bot_list():
    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")


@app.command("kg:stats")
def kg_stats():
    kg = KnowledgeGraph()
    labels: Dict[str, int] = {}
    for node in kg.nodes.values():
        labels[node["label"]] = labels.get(node["label"], 0) + 1
    edges: Dict[str, int] = {}
    for e in kg.edges.values():
        for etype, targets in e.items():
            edges[etype] = edges.get(etype, 0) + len(targets)
    typer.echo(json.dumps({"nodes": labels, "edges": edges}))


@app.command("kg:query")
def kg_query(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    text = Path(file).read_text()
    res = kql_run(text)
    typer.echo(json.dumps(res))


@app.command("kg:neighbors")
def kg_neighbors(
    id: str = typer.Option(..., "--id"), edge: Optional[str] = typer.Option(None, "--edge")
):
    kg = KnowledgeGraph()
    for n in kg.neighbors(id, edge):
        typer.echo(n)


@app.command("kg:rules")
def kg_rules_cmd(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    findings = run_rules(str(file))
    typer.echo(json.dumps([f.__dict__ for f in findings]))


@app.command("chain:run")
def chain_run(plan: Path = typer.Option(..., "--plan", exists=True, dir_okay=False)):
    data = yaml.safe_load(Path(plan).read_text())
    steps: List[PlanStep] = [PlanStep(**s) for s in data.get("steps", [])]
    execute_plan(steps)


if __name__ == "__main__":
    app()
