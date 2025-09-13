from __future__ import annotations

import typer

from bots import BOT_REGISTRY
from orchestrator.orchestrator import Orchestrator

app = typer.Typer(add_completion=False)


def _get_orchestrator() -> Orchestrator:
    orch = Orchestrator()
    for domain, BotCls in BOT_REGISTRY.items():
        orch.register_bot(domain, BotCls())
    return orch


@app.command("bot:list")
def bot_list() -> None:
    """List available bots."""
    for name in BOT_REGISTRY:
        typer.echo(name)


@app.command("task:create")
def task_create(description: str, domain: str) -> None:
    """Create a task."""
    orch = _get_orchestrator()
    task = orch.create_task(description, domain)
    typer.echo(task.id)


@app.command("task:route")
def task_route(task_id: str) -> None:
    """Route a task to its bot."""
    orch = _get_orchestrator()
    response = orch.route(task_id)
    typer.echo(response.status)


@app.command("task:status")
def task_status(task_id: str) -> None:
    """Check task status."""
    orch = _get_orchestrator()
    response = orch.get_status(task_id)
    if response:
        typer.echo(f"{response.status}: {response.data}")
    else:
        typer.echo("no status")


@app.command("task:list")
def task_list() -> None:
    """List known tasks."""
    orch = _get_orchestrator()
    for task in orch.list_tasks():
        typer.echo(f"{task.id} {task.description} ({task.domain})")


if __name__ == "__main__":
    app()
