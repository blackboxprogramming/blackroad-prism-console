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
from dx import (
    monorepo,
    quality,
    test_matrix,
    flaky,
    pr_runner,
    docs_lint,
    style as style_lint,
    onboard,
    commits,
)

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


@app.command("dx:pkgs:list")
def dx_pkgs_list():
    for name in monorepo.discover_packages().keys():
        typer.echo(name)


@app.command("dx:pkgs:graph")
def dx_pkgs_graph():
    pkgs = monorepo.discover_packages()
    monorepo.write_graph(pkgs)
    typer.echo(str((monorepo.ARTIFACTS / "pkgs_graph.json")))


@app.command("dx:pkgs:changed")
def dx_pkgs_changed(since: str = typer.Option(..., "--since")):
    for name in monorepo.changed_packages(since):
        typer.echo(name)


@app.command("dx:quality")
def dx_quality():
    res = quality.run()
    for k, v in res.items():
        typer.echo(f"{k}: {v}")
    if any(v == "failed" for v in res.values()):
        raise typer.Exit(code=1)


@app.command("dx:matrix")
def dx_matrix(cases: Path = typer.Option(..., "--cases", exists=True)):
    cs = test_matrix.load_cases(cases)
    test_matrix.run_matrix(cs)


@app.command("dx:flaky")
def dx_flaky(pattern: str = typer.Option(..., "--pattern"), n: int = typer.Option(10, "-n")):
    data = flaky.run(pattern, n)
    typer.echo(json.dumps(data))


@app.command("dx:quarantine:update")
def dx_quarantine_update():
    flaky.quarantine_update()


@app.command("dx:pr:run")
def dx_pr_run(spec: Path = typer.Option(..., "--spec", exists=True)):
    pr_runner.run(spec)


@app.command("dx:docs:lint")
def dx_docs_lint():
    problems = docs_lint.lint()
    for p in problems:
        typer.echo(p)
    if problems:
        raise typer.Exit(code=1)


@app.command("dx:style:lint")
def dx_style_lint():
    problems = style_lint.lint()
    for p in problems:
        typer.echo(p)
    if problems:
        raise typer.Exit(code=1)


@app.command("dx:onboard:doctor")
def dx_onboard_doctor():
    ok = onboard.doctor()
    if not ok:
        raise typer.Exit(code=1)


@app.command("dx:onboard:bootstrap")
def dx_onboard_bootstrap():
    onboard.bootstrap()


@app.command("dx:commits:lint")
def dx_commits_lint(since: str = typer.Option(None, "--since"), log: Optional[Path] = typer.Option(None, "--log", exists=True, dir_okay=False)):
    bad = commits.lint(since=since, log_file=log)
    for m in bad:
        typer.echo(m)
    if bad:
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
