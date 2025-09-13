import json
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


def _perf_footer(perf: bool, data: dict) -> None:
    if perf:
        typer.echo(
            f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc"
        )


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


@app.command("ir:kpi:compute")
def ir_kpi_compute(period: str = typer.Option(..., "--period")):
    from ir import kpi_sot

    rows = kpi_sot.compute(period)
    typer.echo(json.dumps(rows, indent=2))


@app.command("ir:kpi:signoff")
def ir_kpi_signoff(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
):
    from ir import kpi_signoff

    kpi_signoff.request_signoff(kpi, period)


@app.command("ir:kpi:approve")
def ir_kpi_approve(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import kpi_signoff

    kpi_signoff.approve(kpi, period, as_user)


@app.command("ir:kpi:reject")
def ir_kpi_reject(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import kpi_signoff

    kpi_signoff.reject(kpi, period, as_user)


@app.command("ir:earnings:build")
def ir_earnings_build(
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import earnings

    earnings.build(period, user=as_user)


@app.command("ir:guidance")
def ir_guidance_run(
    period: str = typer.Option(..., "--period"),
    assumptions: Path = typer.Option(..., "--assumptions", exists=True, dir_okay=False),
):
    from ir import guidance

    guidance.run(period, assumptions)


@app.command("ir:blackouts:status")
def ir_blackouts_status(date: str = typer.Option(..., "--date")):
    from ir import blackouts

    code = blackouts.status(date)
    typer.echo(code or "CLEAR")


@app.command("ir:disclose")
def ir_disclose(
    type: str = typer.Option(..., "--type"),
    path: Path = typer.Option(..., "--path", exists=True, dir_okay=False),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import disclosures

    disclosures.log_disclosure(type, str(path), as_user)


@app.command("board:pack")
def board_pack_cmd(month: str = typer.Option(..., "--month")):
    from board import pack

    pack.build(month)


@app.command("ir:faq")
def ir_faq(
    q: str = typer.Option(..., "--q"),
    mode: str = typer.Option("internal", "--mode"),
    as_user: str = typer.Option("U_IR", "--as-user"),
):
    from ir import faq_bot

    resp = faq_bot.answer(q, mode=mode, user=as_user)
    typer.echo(json.dumps(resp, indent=2))


if __name__ == "__main__":
    app()
