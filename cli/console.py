import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from bots import available_bots
from chaos import injector as chaos_injector
from dr import drill as dr_drill
from finance import costing
from orchestrator import flags as flaglib
from orchestrator import migrate as migrator
from orchestrator import orchestrator
from orchestrator import quotas as quotas_lib
from orchestrator.protocols import Task
from policy import deprecation as depol
from release import manager as release_mgr
from tools import storage

app = typer.Typer()

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"


@app.callback()
def main(tenant: Optional[str] = typer.Option(None, "--tenant")):
    if tenant:
        os.environ["PRISM_TENANT"] = tenant


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
    as_user: Optional[str] = typer.Option(None, "--as-user"),
):
    if as_user:
        quotas_lib.check_and_consume(as_user, "tasks")
    ctx = json.loads(storage.read(str(context))) if context else None
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=ctx, created_at=datetime.utcnow())
    storage.write(str(ARTIFACTS / task_id / "task.json"), task.model_dump(mode="json"))
    typer.echo(task_id)


@app.command("task:list")
def task_list():
    for path in sorted(ARTIFACTS.glob("T*/task.json")):
        typer.echo(path.parent.name)


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


# Flag commands
@app.command("flags:list")
def flags_list():
    typer.echo(json.dumps(flaglib.list_flags()))


@app.command("flags:set")
def flags_set(name: str = typer.Option(..., "--name"), value: str = typer.Option(..., "--value")):
    parsed: object = value
    if value.lower() in {"true", "false"}:
        parsed = value.lower() == "true"
    flaglib.set_flag(name, parsed)


# Migration commands
@app.command("migrate:list")
def migrate_list():
    for name, applied in migrator.list_migrations():
        typer.echo(f"{name}\t{'applied' if applied else 'pending'}")


@app.command("migrate:up")
def migrate_up():
    for name in migrator.apply_all():
        typer.echo(name)


@app.command("migrate:status")
def migrate_status():
    typer.echo(migrator.status() or "none")


# Release commands
@app.command("release:stage")
def release_stage(from_env: str = typer.Option(..., "--from"), to_env: str = typer.Option(..., "--to")):
    release_mgr.stage(from_env, to_env)


@app.command("release:promote")
def release_promote(to_env: str = typer.Option(..., "--to")):
    release_mgr.promote(to_env)


@app.command("release:status")
def release_status():
    typer.echo(release_mgr.status())


# Chaos & DR
@app.command("chaos:enable")
def chaos_enable(profile: str = typer.Option("minimal", "--profile")):
    chaos_injector.enable(profile)


@app.command("chaos:disable")
def chaos_disable():
    chaos_injector.disable()


@app.command("dr:tabletop")
def dr_tabletop():
    for step in dr_drill.tabletop():
        typer.echo(step)


# Quotas
@app.command("quota:show")
def quota_show(as_user: str = typer.Option(..., "--as-user")):
    info = quotas_lib.show(as_user)
    typer.echo(json.dumps(info))


# Cost reporting
@app.command("cost:report")
def cost_report(tenant: Optional[str] = typer.Option(None, "--tenant"), user: Optional[str] = typer.Option(None, "--user")):
    report = costing.report(tenant=tenant, user=user)
    typer.echo(json.dumps(report))


# Deprecation
@app.command("deprecation:list")
def deprecation_list():
    typer.echo(json.dumps(depol.registry()))


@app.command("deprecation:lint")
def deprecation_lint():
    issues = depol.lint_repo()
    for issue in issues:
        typer.echo(issue)


if __name__ == "__main__":
    app()
