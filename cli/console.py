from datetime import datetime
from pathlib import Path
from typing import Optional

import json
import re
import typer

from orchestrator.protocols import Task
from orchestrator import orchestrator
from tools import storage
from bots import available_bots
from contracts.validate import ContractError, validate_file
from lakeio.parquet_csv_bridge import export_table, import_table
from retrieval import index as retrieval_index
from semantic.query import evaluate, MODEL

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


def _parse_filters(exprs: list[str]) -> dict:
    filters = {}
    for expr in exprs:
        m = re.match(r"(\w+)([<>=]+)(.+)", expr)
        if not m:
            continue
        field, op, value = m.groups()
        value = value.strip()
        if op == ">=":
            filters[field] = lambda x, v=value: x >= v
        elif op == "<=":
            filters[field] = lambda x, v=value: x <= v
        else:
            filters[field] = lambda x, v=value: x == v
    return filters


@app.command("contract:validate")
def contract_validate(
    table: str = typer.Option(..., "--table"),
    file: Path = typer.Option(..., "--file", exists=True, dir_okay=False),
):
    try:
        validate_file(table, file)
        typer.echo("OK")
    except ContractError as e:
        typer.echo(str(e))
        raise typer.Exit(code=1)


@app.command("lake:export")
def lake_export(
    table: str = typer.Option(..., "--table"),
    fmt: str = typer.Option(..., "--fmt"),
    out: Path = typer.Option(..., "--out"),
):
    export_table(table, fmt, out)
    typer.echo(str(out))


@app.command("lake:import")
def lake_import(
    table: str = typer.Option(..., "--table"),
    fmt: str = typer.Option(..., "--fmt"),
    in_path: Path = typer.Option(..., "--in", exists=True, dir_okay=False),
):
    import_table(table, fmt, in_path)


@app.command("index:build")
def index_build():
    retrieval_index.build()


@app.command("search")
def search(q: str = typer.Option(..., "--q")):
    hits = retrieval_index.search(q)
    for hit in hits:
        typer.echo(f"{hit['score']:.2f}\t{hit['path']}")


@app.command("sem:metrics")
def sem_metrics():
    for m in MODEL.metrics:
        typer.echo(m)


@app.command("sem:query")
def sem_query(
    metric: str = typer.Option(..., "--metric"),
    group_by: list[str] = typer.Option([], "--group-by"),
    filters: list[str] = typer.Option([], "--filter"),
):
    parsed = _parse_filters(filters)
    rows = evaluate(metric, parsed, group_by)
    typer.echo(json.dumps(rows))


if __name__ == "__main__":
    app()
