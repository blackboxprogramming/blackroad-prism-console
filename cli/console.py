import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List

import typer

from orchestrator.protocols import Task
from orchestrator import orchestrator
from tools import storage
from bots import available_bots
from analytics.cohorts import define_cohort, cohort_view
from analytics.anomaly_rules import run_rules
from analytics.decide import plan_actions
from analytics.narrative import build_report
from alerts.local import trigger, list_alerts

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


@app.command("cohort:new")
def cohort_new(name: str = typer.Option(..., "--name"), criteria: Path = typer.Option(..., "--criteria", exists=True)):
    define_cohort(name, json.loads(criteria.read_text()))
    typer.echo("OK")


@app.command("cohort:run")
def cohort_run(
    table: str = typer.Option(..., "--table"),
    name: str = typer.Option(..., "--name"),
    metrics: str = typer.Option(..., "--metrics"),
    window: str = typer.Option("M", "--window"),
):
    mets: List[str] = [m.strip() for m in metrics.split(",") if m.strip()]
    res = cohort_view(table, name, mets, window)
    out_dir = ARTIFACTS / "cohorts"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{name}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
    out_path.write_text(json.dumps(res, indent=2))
    (out_dir / "latest.json").write_text(json.dumps(res, indent=2))
    typer.echo(json.dumps(res))


@app.command("anomaly:run")
def anomaly_run(rules: Path = typer.Option(..., "--rules", exists=True), window: str = typer.Option("W", "--window")):
    res = run_rules(rules, window)
    typer.echo(json.dumps(res))


@app.command("decide:plan")
def decide_plan(
    anomalies: Path = typer.Option(..., "--anomalies", exists=True),
    goals: Path = typer.Option(..., "--goals", exists=True),
    constraints: Path = typer.Option(..., "--constraints", exists=True),
):
    path = plan_actions(anomalies, goals, constraints)
    typer.echo(str(path))


@app.command("narrative:build")
def narrative_build(plan: Path = typer.Option(..., "--plan", exists=True), out: Path = typer.Option(..., "--out")):
    build_report(plan, out)
    typer.echo("built")


@app.command("alerts:trigger")
def alerts_trigger(
    source: str = typer.Option(..., "--source"),
    file: Path = typer.Option(..., "--file", exists=True),
    min_severity: str = typer.Option("high", "--min-severity"),
):
    trigger(source, file, min_severity)


@app.command("alerts:list")
def alerts_list(limit: int = typer.Option(20, "--limit")):
    for e in list_alerts(limit):
        typer.echo(json.dumps(e))


if __name__ == "__main__":
    app()
