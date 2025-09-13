import csv
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
from services import catalog as svc_catalog
from services import deps as svc_deps
from runbooks import executor as rb_executor
from healthchecks import synthetic as hc_synth
from change import calendar as change_calendar
from status import generator as status_gen
import time

from people import analytics, comp_cycle, headcount, orgchart, perf_cycle, recruiting

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


@app.command("svc:load")
def svc_load(dir: str = typer.Option("configs/services", "--dir")):
    svc_catalog.load_services(f"{dir}/*.yaml")
    typer.echo("catalog loaded")


@app.command("svc:deps")
def svc_deps_cmd(service: str = typer.Option(..., "--service"), dir: str = typer.Option("configs/services", "--dir")):
    services = svc_catalog.load_services(f"{dir}/*.yaml")
    for dep in svc_deps.blast_radius(service, services):
        typer.echo(dep)


@app.command("svc:validate")
def svc_validate(dir: str = typer.Option("configs/services", "--dir")):
    services = svc_catalog.load_services(f"{dir}/*.yaml")
    errs = svc_deps.validate_dependencies(services)
    if errs:
        for e in errs:
            typer.echo(e)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("rb:run")
def rb_run(file: str = typer.Option(..., "--file")):
    code = rb_executor.run(file)
    typer.echo(code)


@app.command("rb:list")
def rb_list():
    for name in rb_executor.list_examples():
        typer.echo(name)


@app.command("hc:run")
def hc_run(service: str = typer.Option(..., "--service")):
    results = hc_synth.run_checks(service)
    typer.echo(json.dumps(results))


@app.command("hc:summary")
def hc_summary(service: str = typer.Option(..., "--service")):
    data = hc_synth.summary(service)
    typer.echo(json.dumps(data))


@app.command("change:add")
def change_add(
    service: str = typer.Option(..., "--service"),
    type: str = typer.Option(..., "--type"),
    start: str = typer.Option(..., "--start"),
    end: str = typer.Option(..., "--end"),
    risk: str = typer.Option(..., "--risk"),
):
    cid = f"chg-{int(time.time())}"
    ch = change_calendar.Change(id=cid, service=service, type=type, start=start, end=end, owner="cli", risk=risk)
    change_calendar.add_change(ch)
    typer.echo(cid)


@app.command("change:list")
def change_list(
    service: str = typer.Option(None, "--service"),
    start: str = typer.Option(None, "--from"),
    end: str = typer.Option(None, "--to"),
):
    for c in change_calendar.list_changes(service, start, end):
        typer.echo(json.dumps(c))


@app.command("change:conflicts")
def change_conflicts(service: str = typer.Option(..., "--service")):
    issues = change_calendar.conflicts(service)
    if issues:
        for i in issues:
            typer.echo(i)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("people:hc:forecast")
def people_hc_forecast(
    plans: Path = typer.Option(..., "--plans", exists=True),
    attrition: Path = typer.Option(..., "--attrition", exists=True),
    transfers: Path = typer.Option(..., "--transfers", exists=True),
    policy: Path = typer.Option(..., "--policy", exists=True),
):
    plan, summary = headcount.forecast(plans, attrition, transfers, policy)
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_dir = ARTIFACTS / "people" / f"headcount_{ts}"
    headcount.write_artifacts(out_dir, plan, summary)
    typer.echo("hc_plan_generated")


@app.command("people:req:load")
def people_req_load(dir: Path = typer.Option(..., "--dir", exists=True)):
    data = recruiting.load_reqs(dir)
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_dir = ARTIFACTS / "people" / f"recruiting_{ts}"
    recruiting.write_artifacts(out_dir, data)
    typer.echo("recruiting_loaded")


@app.command("people:req:report")
def people_req_report(dept: str = typer.Option(..., "--dept")):
    typer.echo(f"report for {dept}")


@app.command("people:perf:new")
def people_perf_new(
    cycle: str = typer.Option(..., "--cycle"),
    config: Path = typer.Option(..., "--config", exists=True),
):
    demo = Path("fixtures/people/demographics.csv")
    out_dir = ARTIFACTS / "people" / "perf" / cycle
    perf_cycle.new_cycle(cycle, config, demo, out_dir)
    typer.echo("perf_cycle_created")


@app.command("people:perf:calibrate")
def people_perf_calibrate(cycle: str = typer.Option(..., "--cycle")):
    cycle_dir = ARTIFACTS / "people" / "perf" / cycle
    perf_cycle.calibrate(cycle_dir)
    typer.echo("perf_calibrated")


@app.command("people:comp:plan")
def people_comp_plan(
    cycle: str = typer.Option(..., "--cycle"),
    policy: Path = typer.Option(..., "--policy", exists=True),
):
    demo = Path("fixtures/people/demographics.csv")
    out_dir = ARTIFACTS / "people" / "comp" / cycle
    comp_cycle.plan(cycle, demo, policy, out_dir)
    typer.echo("comp_plan_built")


@app.command("people:comp:letters")
def people_comp_letters(cycle: str = typer.Option(..., "--cycle")):
    cycle_dir = ARTIFACTS / "people" / "comp" / cycle
    comp_cycle.letters(cycle_dir)
    typer.echo("letters_emitted")


@app.command("people:org:build")
def people_org_build(include_open_reqs: bool = typer.Option(False, "--include-open-reqs")):
    demo = Path("fixtures/people/demographics.csv")
    include = None
    if include_open_reqs:
        plans = Path("fixtures/people/plans.csv")
        include = headcount._read_csv(plans) if plans.exists() else None
    children = orgchart.build_tree(demo, include)
    tree = orgchart.render_tree(children)
    out_dir = ARTIFACTS / "people" / "orgchart"
    orgchart.write_artifacts(out_dir, tree, list(csv.DictReader(demo.open())))
    typer.echo("orgchart_built")


@app.command("people:org:whatif")
def people_org_whatif(
    freeze: str = typer.Option(None, "--freeze"),
    move: str = typer.Option(None, "--move"),
):
    typer.echo("what-if complete")


@app.command("people:analytics:build")
def people_analytics_build():
    demo = Path("fixtures/people/demographics.csv")
    attr = Path("fixtures/people/attrition.csv")
    recruiting_path = ARTIFACTS / "people"
    json_data = next(recruiting_path.glob("recruiting_*/kanban.json"), None)
    out_dir = ARTIFACTS / "people" / f"analytics_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    analytics.build(demo, attr, Path(str(json_data)) if json_data else Path("nonexistent"), Path("configs/people/pay_bands.yaml"), out_dir)
    typer.echo("analytics_built")


@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")


if __name__ == "__main__":
    app()
