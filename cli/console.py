import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List

import typer

from orchestrator.protocols import Task
from orchestrator import orchestrator
from tools import storage
from bots import available_bots
from security import esign
from sop import checklist
from hitl import queue as hitl_queue
from hitl import assign as hitl_assign
from records import retention
from tui import app as tui_app

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


# e-signature ---------------------------------------------------------------


@app.command("esign:keygen")
def esign_keygen(user: str = typer.Option(..., "--user")):
    secret = esign.keygen(user)
    typer.echo(secret)


@app.command("esign:sign")
def esign_sign(user: str = typer.Option(..., "--user"), text: str = typer.Option(..., "--text")):
    data = esign.sign_statement(user, text)
    typer.echo(data["signature"])


@app.command("esign:verify")
def esign_verify(
    user: str = typer.Option(..., "--user"),
    sig: str = typer.Option(..., "--sig"),
    text: str = typer.Option(..., "--text"),
):
    ok = esign.verify_statement(sig, user, text)
    typer.echo("OK" if ok else "FAIL")


# SOP checklists ------------------------------------------------------------


@app.command("sop:new")
def sop_new(name: str = typer.Option(..., "--name"), from_path: Path = typer.Option(..., "--from", exists=True, dir_okay=False)):
    cl = checklist.load_template(name)
    checklist.save_checklist(cl)
    typer.echo(name)


@app.command("sop:attest")
def sop_attest(
    id: str = typer.Option(..., "--id"),
    actor: str = typer.Option(..., "--actor"),
    note: str = typer.Option(..., "--note"),
):
    checklist.attest_step(id, actor, note)


@app.command("sop:status")
def sop_status(name: str = typer.Option(..., "--name")):
    remaining = checklist.remaining_required(name)
    for step in remaining:
        typer.echo(step.id)


# HITL queue ----------------------------------------------------------------


@app.command("hitl:enqueue")
def hitl_enqueue(
    task: str = typer.Option(..., "--task"),
    type: str = typer.Option(..., "--type"),
    artifact: Path = typer.Option(..., "--artifact"),
    reviewers: str = typer.Option("", "--reviewers"),
    requested_by: str = typer.Option("system", "--requested-by"),
):
    revs = [r for r in reviewers.split(",") if r]
    item = hitl_queue.enqueue(task, str(artifact), type, requested_by, revs)
    typer.echo(item.id)


@app.command("hitl:list")
def hitl_list(status: str = typer.Option(None, "--status")):
    items = hitl_queue.list_items(status)
    for item in items:
        typer.echo(f"{item.id}\t{item.status}\t{','.join(item.reviewers)}")


@app.command("hitl:approve")
def hitl_approve(
    id: str = typer.Option(..., "--id"),
    reviewer: str = typer.Option(..., "--reviewer"),
    note: str = typer.Option("", "--note"),
):
    hitl_queue.approve(id, reviewer, note)


@app.command("hitl:request-changes")
def hitl_request_changes(
    id: str = typer.Option(..., "--id"),
    reviewer: str = typer.Option(..., "--reviewer"),
    note: str = typer.Option("", "--note"),
):
    hitl_queue.request_changes(id, reviewer, note)


@app.command("hitl:auto-assign")
def hitl_auto_assign(type: str = typer.Option(..., "--type")):
    hitl_assign.auto_assign(type)


@app.command("hitl:sla-report")
def hitl_sla_report():
    for id, remaining in hitl_assign.sla_report():
        typer.echo(f"{id}\t{int(remaining)}")


# Records retention ---------------------------------------------------------


@app.command("records:status")
def records_status():
    data = retention.status()
    typer.echo(json.dumps(data))


@app.command("records:sweep")
def records_sweep(dry_run: bool = typer.Option(False, "--dry-run")):
    paths = retention.sweep(dry_run=dry_run)
    for p in paths:
        typer.echo(str(p))


@app.command("records:hold")
def records_hold(rtype: str = typer.Option(..., "--type"), on: bool = typer.Option(True, "--on")):
    retention.toggle_hold(rtype, on)


# TUI -----------------------------------------------------------------------


@app.command("tui:run")
def tui_run(theme: str = typer.Option("high_contrast", "--theme"), lang: str = typer.Option("en", "--lang")):
    tui_app.run(theme=theme, lang=lang)


if __name__ == "__main__":
    app()
