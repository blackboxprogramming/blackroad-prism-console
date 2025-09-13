import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from tools import storage

from sec.assets import load_from_dir as assets_load, list_assets as assets_list
from sec.detect.engine import run as detect_run
from sec.ir import add_timeline as ir_timeline, assign as ir_assign, open_from_detections as ir_open, resolve as ir_resolve
from sec.vuln import import_csv as vuln_import, prioritize as vuln_prioritize
from sec.purple.sim import run as purple_run
from sec.sbom_watch import watch as sbom_watch

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


@app.command("sec:assets:load")
def sec_assets_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    assets_load(dir)
    typer.echo("assets loaded")


@app.command("sec:assets:list")
def sec_assets_list(
    asset_type: Optional[str] = typer.Option(None, "--type"),
    owner: Optional[str] = typer.Option(None, "--owner"),
):
    for a in assets_list(asset_type, owner):
        typer.echo(a.id)


@app.command("sec:detect:run")
def sec_detect_run(
    rules: Path = typer.Option(..., "--rules", exists=True, file_okay=False),
    logs: Path = typer.Option(..., "--logs", exists=True, file_okay=False),
):
    detect_run(rules, logs)
    typer.echo("detections complete")


@app.command("sec:ir:open")
def sec_ir_open(
    detections: List[Path] = typer.Option(..., "--detections"),
):
    inc = ir_open(detections)
    typer.echo(inc.id)


@app.command("sec:ir:assign")
def sec_ir_assign(
    id: str = typer.Option(..., "--id"),
    user: str = typer.Option(..., "--user"),
):
    ir_assign(id, user)
    typer.echo("assigned")


@app.command("sec:ir:timeline")
def sec_ir_timeline(
    id: str = typer.Option(..., "--id"),
    event: str = typer.Option(..., "--event"),
):
    ir_timeline(id, event)
    typer.echo("noted")


@app.command("sec:ir:resolve")
def sec_ir_resolve(
    id: str = typer.Option(..., "--id"),
    resolution: str = typer.Option(..., "--resolution"),
):
    ir_resolve(id, resolution)
    typer.echo("resolved")


@app.command("sec:vuln:import")
def sec_vuln_import(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    vuln_import(file)
    typer.echo("vulns imported")


@app.command("sec:vuln:prioritize")
def sec_vuln_prior(top: int = typer.Option(50, "--top")):
    vulns = vuln_prioritize(top)
    typer.echo(str(len(vulns)))


@app.command("sec:purple:run")
def sec_purple_run(
    name: str = typer.Option(..., "--name"),
    config: Path = typer.Option(Path("configs/sec/purple"), "--config", exists=True, file_okay=False),
):
    purple_run(name, config)
    typer.echo("purple complete")


@app.command("sec:sbom:watch")
def sec_sbom_watch_cmd(
    sbom: Path = typer.Option(..., "--sbom", exists=True, dir_okay=False),
    cves: Path = typer.Option(..., "--cves", exists=True, dir_okay=False),
):
    sbom_watch(sbom, cves)
    typer.echo("sbom scanned")


if __name__ == "__main__":
    app()
