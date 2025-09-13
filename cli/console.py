import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from orchestrator.protocols import Task
from orchestrator import orchestrator
from tools import storage
from bots import available_bots
from twin import snapshots, replay, stress, compare

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


@app.command("twin:checkpoint")
def twin_checkpoint(name: str = typer.Option(..., "--name")):
    path = snapshots.create_checkpoint(name)
    typer.echo(path)


@app.command("twin:list")
def twin_list():
    for info in snapshots.list_checkpoints():
        typer.echo(f"{info['name']}\t{info['created_at']}")


@app.command("twin:restore")
def twin_restore(name: str = typer.Option(..., "--name")):
    snapshots.restore_checkpoint(name)
    typer.echo("restored")


@app.command("twin:replay")
def twin_replay(
    range_from: Optional[str] = typer.Option(None, "--from"),
    range_to: Optional[str] = typer.Option(None, "--to"),
    mode: str = typer.Option("verify", "--mode"),
):
    report = replay.replay(range_from, range_to, mode=mode)
    typer.echo(str(report))


@app.command("twin:stress")
def twin_stress(
    profile: str = typer.Option("default", "--profile"),
    duration: int = typer.Option(60, "--duration"),
):
    prof = stress.load_profile(profile)
    stress.run_load(prof, duration)
    typer.echo("ok")


@app.command("twin:compare")
def twin_compare(
    left: str = typer.Option(..., "--left"),
    right: str = typer.Option(..., "--right"),
):
    res = compare.compare_runs(left, right)
    typer.echo(str(res))


if __name__ == "__main__":
    app()
