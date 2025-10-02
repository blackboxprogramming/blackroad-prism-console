import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

import settings
from bots import available_bots
from integrations import (
    mappers,
    salesforce_stub,
    sap_stub,
    servicenow_stub,
    workday_stub,
)
from observability import report as obs_report
from orchestrator import metrics, orchestrator, redaction
from orchestrator.protocols import Task
from policy import enforcer
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


@app.callback()
def main(
    ctx: typer.Context,
    dry_run: bool = typer.Option(False, "--dry-run", help="Do not write artifacts"),
):
    settings.DRY_RUN = dry_run


@app.command("bot:run")
def bot_run(
    bot: str = typer.Option(..., "--bot"),
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    ctx = json.loads(storage.read(str(context))) if context else None
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=ctx, created_at=datetime.utcnow())
    response = orchestrator.route(task, bot)
    if settings.DRY_RUN:
        typer.echo("DRY-RUN: no artifacts written")
    else:
        scrubbed_task = Task(
            id=task.id,
            goal=task.goal,
            context=redaction.scrub(task.context) if task.context else None,
            created_at=task.created_at,
        )
        storage.write(
            str(ARTIFACTS / task_id / "task.json"),
            scrubbed_task.model_dump(mode="json"),
        )
        storage.write(
            str(ARTIFACTS / task_id / "response.json"), response.model_dump(mode="json")
        )
    typer.echo(response.summary)


@app.command("policy:check-task")
def policy_check_task(
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    ctx_raw = json.loads(storage.read(str(context))) if context else None
    ctx = redaction.scrub(ctx_raw)
    task = Task(id="TCHK", goal=goal, context=ctx, created_at=datetime.utcnow())
    violations = enforcer.check_task(task)
    if violations:
        typer.echo("\n".join(violations))
    else:
        typer.echo("OK")


@app.command("import:salesforce")
def import_salesforce(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = salesforce_stub.load_opportunities(str(fixtures))
    rows = mappers.to_rows(records, ["id", "owner", "stage", "amount", "close_date", "age_days"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(
            str(ARTIFACTS / "imports" / "salesforce.json"), json.dumps(rows)
        )
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:sap")
def import_sap(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = sap_stub.load_gl(str(fixtures))
    rows = mappers.to_rows(records, ["account", "period", "debit", "credit", "entity"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(str(ARTIFACTS / "imports" / "sap_gl.json"), json.dumps(rows))
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:servicenow")
def import_servicenow(
    fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)
):
    records = servicenow_stub.load_incidents(str(fixtures))
    rows = mappers.to_rows(records, ["id", "sev", "opened_at", "closed_at", "service"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(
            str(ARTIFACTS / "imports" / "servicenow.json"), json.dumps(rows)
        )
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:workday")
def import_workday(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = workday_stub.load_headcount(str(fixtures))
    rows = mappers.to_rows(
        records, ["employee_id", "dept", "role", "grade", "region", "start_date", "status"]
    )
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(str(ARTIFACTS / "imports" / "workday.json"), json.dumps(rows))
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("obs:report")
def obs_report_cmd():
    if settings.DRY_RUN:
        typer.echo("DRY-RUN: no artifacts written")
        obs_report.generate()
        return
    obs_report.write_report()
    typer.echo("Report generated")


@app.command("bot:list")
def bot_list():
    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")




if __name__ == "__main__":
    app()
