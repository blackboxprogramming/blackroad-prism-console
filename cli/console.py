import json
from contextlib import nullcontext
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
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


def _footer(perf: bool, stats: dict, cache: str = "na"):
    if perf:
        typer.echo(
            f"time={stats.get('elapsed_ms', 0)} rss={stats.get('rss_mb')} cache={cache} exec=inproc"
        )


@app.command("bench:list")
def bench_list(perf: bool = typer.Option(False, "--perf", is_flag=True)):
    ctx = perf_timer("bench_list") if perf else nullcontext({})
    with ctx as p:
        for name in bench_runner.list_scenarios():
            typer.echo(name)
    _footer(perf, p)


@app.command("bench:show")
def bench_show(
    name: str = typer.Option(..., "--name"),
    perf: bool = typer.Option(False, "--perf", is_flag=True),
):
    ctx = perf_timer("bench_show") if perf else nullcontext({})
    with ctx as p:
        data = bench_runner.show_scenario(name)
        typer.echo(json.dumps(data))
    _footer(perf, p)


@app.command("bench:run")
def bench_run(
    name: str = typer.Option(..., "--name"),
    iterations: int = typer.Option(20, "--iter", "--iterations"),
    warmup: int = typer.Option(5, "--warmup"),
    cache: str = typer.Option("na", "--cache"),
    export_csv: Optional[Path] = typer.Option(None, "--export-csv"),
    perf: bool = typer.Option(False, "--perf", is_flag=True),
    as_user: Optional[str] = typer.Option(None, "--as-user"),
):
    ctx = perf_timer("bench_run") if perf else nullcontext({})
    with ctx as p:
        res = bench_runner.run_bench(
            name, iterations=iterations, warmup=warmup, cache=cache
        )
        if export_csv:
            src = Path(res["env"]).with_name("timings.csv")
            storage.write(str(export_csv), Path(src).read_text())
        typer.echo(json.dumps(res, indent=2))
    _footer(perf, p, cache=cache)


@app.command("bench:all")
def bench_all(
    iterations: int = typer.Option(20, "--iter", "--iterations"),
    warmup: int = typer.Option(5, "--warmup"),
    perf: bool = typer.Option(False, "--perf", is_flag=True),
):
    ctx = perf_timer("bench_all") if perf else nullcontext({})
    with ctx as p:
        results = bench_runner.run_all(iterations=iterations, warmup=warmup)
        typer.echo(json.dumps(results, indent=2))
    _footer(perf, p)


@app.command("slo:report")
def slo_report_cmd(perf: bool = typer.Option(False, "--perf", is_flag=True)):
    ctx = perf_timer("slo_report") if perf else nullcontext({})
    with ctx as p:
        slo_report.build_report()
    _footer(perf, p)


@app.command("slo:gate")
def slo_gate(
    fail_on: str = typer.Option("regressions", "--fail-on"),
    perf: bool = typer.Option(False, "--perf", is_flag=True),
):
    ctx = perf_timer("slo_gate") if perf else nullcontext({})
    with ctx as p:
        rc = slo_report.gate(fail_on=fail_on)
    _footer(perf, p)
    if rc:
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
