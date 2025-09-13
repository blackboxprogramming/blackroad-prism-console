import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from tools import storage
from twin import compare as twin_compare
from twin import replay as twin_replay
from twin import snapshots
from twin import stress as twin_stress

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


def _perf_footer(perf: bool, data: dict) -> None:
    if perf:
        typer.echo(f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc")


@app.command("bench:list")
def bench_list():
    for name in bench_runner.list_scenarios():
        typer.echo(name)


@app.command("bench:show")
def bench_show(name: str = typer.Option(..., "--name")):
    cfg = bench_runner.load_scenario(name)
    typer.echo(json.dumps(cfg, indent=2))


@app.command("bench:run")
def bench_run(
    name: str = typer.Option(..., "--name"),
    iterations: int = typer.Option(20, "--iter"),
    warmup: int = typer.Option(5, "--warmup"),
    cache: str = typer.Option("na", "--cache"),
    export_csv: Optional[Path] = typer.Option(None, "--export-csv"),
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("bench_run") as p:
            bench_runner.run_bench(name, iterations, warmup, cache, export_csv)
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        bench_runner.run_bench(name, iterations, warmup, cache, export_csv)
    _perf_footer(perf, p)


@app.command("bench:all")
def bench_all(
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("bench_all") as p:
            bench_runner.run_all()
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        bench_runner.run_all()
    _perf_footer(perf, p)


@app.command("slo:report")
def slo_report_cmd(
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("slo_report") as p:
            slo_report.build_report()
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        slo_report.build_report()
    _perf_footer(perf, p)


@app.command("slo:gate")
def slo_gate(
    fail_on: str = typer.Option("regressions", "--fail-on"),
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("slo_gate") as p:
            ok = slo_report.gate(fail_on)
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        ok = slo_report.gate(fail_on)
    _perf_footer(perf, p)
    if not ok:
        raise typer.Exit(code=1)


@app.command("twin:checkpoint")
def twin_checkpoint(name: str = typer.Option(..., "--name")):
    snapshots.create_checkpoint(name)
    typer.echo(name)


@app.command("twin:list")
def twin_list():
    for cp in snapshots.list_checkpoints():
        typer.echo(cp["name"])


@app.command("twin:restore")
def twin_restore(name: str = typer.Option(..., "--name")):
    snapshots.restore_checkpoint(name)
    typer.echo("restored")


@app.command("twin:replay")
def twin_replay_cmd(
    range_from: Optional[str] = typer.Option(None, "--from"),
    range_to: Optional[str] = typer.Option(None, "--to"),
    window: Optional[str] = typer.Option(None, "--window"),
    filter: List[str] = typer.Option([], "--filter"),
    mode: str = typer.Option("verify", "--mode"),
):
    if window == "last_24h":
        end = datetime.utcnow()
        start = end - timedelta(days=1)
    else:
        if not range_from or not range_to:
            raise typer.Exit(code=1)
        start = datetime.fromisoformat(range_from)
        end = datetime.fromisoformat(range_to)
    filt = {}
    for item in filter:
        if "=" in item:
            k, v = item.split("=", 1)
            filt[k] = v
    rep = twin_replay.replay(start.isoformat(), end.isoformat(), filt, mode)
    typer.echo(rep.count)


@app.command("twin:stress")
def twin_stress_cmd(
    profile: str = typer.Option(..., "--profile"),
    duration: int = typer.Option(60, "--duration"),
    cache: str = typer.Option("on", "--cache"),
    exec_mode: str = typer.Option("inproc", "--exec"),
    tenant: str = typer.Option("system", "--tenant"),
):
    prof = twin_stress.load_profile(profile)
    twin_stress.run_load(prof, duration, cache, exec_mode, tenant)
    typer.echo("ok")


@app.command("twin:compare")
def twin_compare_cmd(
    left: Path = typer.Option(..., "--left"),
    right: Path = typer.Option(..., "--right"),
):
    twin_compare.compare_runs(str(left), str(right))
    typer.echo("ok")


if __name__ == "__main__":
    app()
