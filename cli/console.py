import json
import uuid
from pathlib import Path

import typer

from orchestrator.orchestrator import Orchestrator
from orchestrator.protocols import Task

app = typer.Typer(name="console")
BASE_PATH = Path(__file__).resolve().parent.parent
TASK_FILE = BASE_PATH / "tasks.json"


def load_tasks() -> dict:
    if TASK_FILE.exists():
        return json.loads(TASK_FILE.read_text())
    return {}


def save_tasks(tasks: dict) -> None:
    TASK_FILE.write_text(json.dumps(tasks, indent=2))


@app.command("task:create")
def task_create(goal: str, context: Path = typer.Option(None, help="Path to context JSON")):
    """Create a task."""
    tasks = load_tasks()
    task_id = f"T{uuid.uuid4().hex[:6]}"
    ctx = json.loads(context.read_text()) if context else None
    tasks[task_id] = {"goal": goal, "context": ctx, "status": "created"}
    save_tasks(tasks)
    typer.echo(task_id)


@app.command("task:route")
def task_route(id: str, bot: str):
    """Route a task to a bot."""
    tasks = load_tasks()
    task_data = tasks.get(id)
    if not task_data:
        raise typer.Exit(code=1)
    orch = Orchestrator(base_path=BASE_PATH)
    response = orch.route(Task(id=id, goal=task_data["goal"], context=task_data["context"]), bot)
    tasks[id]["status"] = "completed"
    tasks[id]["last_bot"] = bot
    save_tasks(tasks)
    typer.echo(response.summary)


@app.command("task:status")
def task_status(id: str):
    tasks = load_tasks()
    task = tasks.get(id)
    if not task:
        raise typer.Exit(code=1)
    typer.echo(json.dumps(task, indent=2))


@app.command("task:list")
def task_list():
    tasks = load_tasks()
    for tid, info in tasks.items():
        typer.echo(f"{tid}: {info['goal']} ({info['status']})")


@app.command("bot:list")
def bot_list():
    from bots import BOT_REGISTRY

    for name, bot in BOT_REGISTRY.items():
        typer.echo(f"{name}")


if __name__ == "__main__":
    app()
