import importlib
import csv
import json
import time
from dataclasses import asdict
import os
import subprocess
import sys
from contextlib import nullcontext
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from typing import Optional
from dataclasses import asdict

import typer
import yaml

from bench import runner as bench_runner
from bots import available_bots
from change import calendar as change_calendar
from enablement import calendar as en_cal
from enablement import certify as en_cert
from enablement import courses as en_courses
from enablement import feedback as en_fb
from enablement import labs as en_labs
from enablement import paths as en_paths
from enablement import quizzes as en_quizzes
from enablement import readiness as en_read
from healthchecks import synthetic as hc_synth
from mfg import coq as mfg_coq
from mfg import mrp as mfg_mrp
from mfg import routing as mfg_routing
from mfg import spc as mfg_spc
from mfg import work_instructions as mfg_wi
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from plm import bom as plm_bom
from plm import eco as plm_eco
from runbooks import executor as rb_executor
from dashboards import sc_ops_fin
from finance import wc as finance_wc
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from procure import optimizer as procure_opt
from sop import plan as sop_plan
from supply import inventory_sim, logistics
from tools import storage
from strategy import okr as strat_okr
from strategy import bets as strat_bets
from strategy import scorecard as strat_scorecard
from strategy import reviews as strat_reviews
from strategy import tradeoffs as strat_tradeoffs
from strategy import memos as strat_memos
from services import catalog as svc_catalog
from services import deps as svc_deps
from status import generator as status_gen
from tools import storage
from aiops import canary as aiops_canary
from aiops import config_drift as aiops_drift
from aiops import correlation as aiops_correlation
from aiops import maintenance as aiops_maintenance
from aiops import remediation as aiops_remediation
from aiops import slo_budget as aiops_budget

VERB_FUN: dict[str, str] = {}
VERB_FUN['plm:bom:where-used'] = 'cli_bom_where_used'
import time
import importlib

from plm import bom as plm_bom, eco as plm_eco
from mfg import routing as mfg_routing, work_instructions as mfg_wi, spc as mfg_spc, coq as mfg_coq, mrp as mfg_mrp

mfg_yield = importlib.import_module("mfg.yield")

mfg_yield = importlib.import_module("mfg.yield")

from close import calendar as close_calendar
from close import flux as close_flux
from close import journal as close_journal
from close import packet as close_packet
from close import recon as close_recon
from close import sox as close_sox
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
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
from tools import storage
from twin import snapshots, replay, stress, compare

from legal import clm, clauses, redline, obligations, compliance_calendar, export_controls, data_room
from close import journal as close_journal
from close import recon as close_recon
from close import flux as close_flux
from close import sox as close_sox
from close import packet as close_packet
import time
from mdm import (
    domains as mdm_domains,
    match as mdm_match,
    survivorship as mdm_survivorship,
    quality as mdm_quality,
    catalog as mdm_catalog,
    steward as mdm_steward,
    lineage_diff as mdm_lineage_diff,
    changes as mdm_changes,
)

from marketing import segments as mkt_segments
from marketing import lead_score as mkt_lead
from marketing import attribution as mkt_attr
from marketing import seo_audit as mkt_seo
from marketing import social as mkt_social
from marketing import calendar as mkt_cal
from marketing import creatives as mkt_creatives
from marketing import dashboards as mkt_dash
from marketing import campaigns as mkt_campaigns

from ir import (
    kpi_sot,
    kpi_signoff,
    earnings,
    guidance,
    blackouts,
    disclosures,
    faq_bot,
)
from board import pack as board_pack
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
from bots import available_bots
from kg.chainer import PlanStep, execute_plan
from kg.model import KnowledgeGraph
from kg.provenance import capture_event
from kg.query import run as kql_run
from kg.rules import run_rules
from orchestrator import orchestrator
from orchestrator.protocols import Task
from tools import storage
from twin import compare as twin_compare
from twin import replay as twin_replay
from twin import snapshots
from twin import stress as twin_stress

# phase 25 additions
from partners import catalog as partner_catalog
from partners import certify as partner_certify
from partners import orders as partner_orders
from licensing import sku_packs, keys as license_keys, entitlements as entitlement_engine
from billing import invoices as billing_invoices

from sec.assets import load_from_dir as assets_load, list_assets as assets_list
from sec.detect.engine import run as detect_run
from sec.ir import add_timeline as ir_timeline, assign as ir_assign, open_from_detections as ir_open, resolve as ir_resolve
from sec.vuln import import_csv as vuln_import, prioritize as vuln_prioritize
from sec.purple.sim import run as purple_run
from sec.sbom_watch import watch as sbom_watch
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from tools import storage

from experiments import ab_engine, flag_analytics, registry as exp_registry, rollout, review_pack
from growth import loops as growth_loops, funnels as growth_funnels

from close import calendar as close_calendar, journal as close_journal, recon as close_recon, flux as close_flux, sox as close_sox, packet as close_packet

app = typer.Typer()
from rnd import ideas as rnd_ideas
from rnd import experiments as rnd_exp
from rnd import radar as rnd_radar
from rnd import ip as rnd_ip
from rnd import notes as rnd_notes
from rnd import merge as rnd_merge
from rnd import dashboard as rnd_dashboard

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"


def _next_task_id() -> str:
    counter_path = ARTIFACTS / "last_task_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    if not settings.DRY_RUN:
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
    from orchestrator.protocols import Task

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
    storage.write(str(ARTIFACTS / task_id / "task.json"), task.model_dump(mode="json"))
    capture_event({"type": "task", "id": task_id, "goal": goal})
    typer.echo(task_id)


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
    from orchestrator import orchestrator
    from orchestrator.protocols import Task

    task_data = json.loads(storage.read(str(ARTIFACTS / id / "task.json")))
    task = Task(**task_data)
    response = orchestrator.route(task, bot)
    storage.write(str(ARTIFACTS / id / "response.json"), response.model_dump(mode="json"))
    capture_event(
        {
            "type": "artifact",
            "task_id": id,
            "bot": bot,
            "path": str(ARTIFACTS / id / "response.json"),
            "intent": task.goal,
            "artifact_type": "response",
        }
    )
    typer.echo(response.summary)


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
import json
import uuid
from pathlib import Path

import typer

from orchestrator.orchestrator import Orchestrator
from orchestrator.protocols import Task

app = typer.Typer(name="console")
BASE_PATH = Path(__file__).resolve().parent.parent
TASK_FILE = BASE_PATH / "tasks.json"


def load_tasks() -> dict:
    if TASK_FILE.exists():
        return json.loads(TASK_FILE.read_text())
    return {}


def save_tasks(tasks: dict) -> None:
    TASK_FILE.write_text(json.dumps(tasks, indent=2))


@app.command("task:create")
def task_create(goal: str, context: Path = typer.Option(None, help="Path to context JSON")):
    """Create a task."""
    tasks = load_tasks()
    task_id = f"T{uuid.uuid4().hex[:6]}"
    ctx = json.loads(context.read_text()) if context else None
    tasks[task_id] = {"goal": goal, "context": ctx, "status": "created"}
    save_tasks(tasks)
    typer.echo(task_id)


@app.command("task:route")
def task_route(id: str, bot: str):
    """Route a task to a bot."""
    tasks = load_tasks()
    task_data = tasks.get(id)
    if not task_data:
        raise typer.Exit(code=1)
    orch = Orchestrator(base_path=BASE_PATH)
    response = orch.route(Task(id=id, goal=task_data["goal"], context=task_data["context"]), bot)
    tasks[id]["status"] = "completed"
    tasks[id]["last_bot"] = bot
    save_tasks(tasks)
    typer.echo(response.summary)


@app.command("task:status")
def task_status(id: str):
    tasks = load_tasks()
    task = tasks.get(id)
    if not task:
        raise typer.Exit(code=1)
    typer.echo(json.dumps(task, indent=2))


@app.command("task:list")
def task_list():
    tasks = load_tasks()
    for tid, info in tasks.items():
        typer.echo(f"{tid}: {info['goal']} ({info['status']})")


@app.command("bot:list")
def bot_list():
    from bots import available_bots

    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")


def _perf_footer(perf: bool, data: dict) -> None:
    if perf:
        typer.echo(f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc")
        typer.echo(
            f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc"
def _footer(perf: bool, stats: dict, cache: str = "na"):
    if perf:
        typer.echo(
            f"time={stats.get('elapsed_ms', 0)} rss={stats.get('rss_mb')} cache={cache} exec=inproc"
        )


@app.command("bench:list")
def bench_list():
    for name in bench_runner.list_scenarios():
        typer.echo(name)


@app.command("bench:show")
def bench_show(name: str = typer.Option(..., "--name")):
    cfg = bench_runner.load_scenario(name)
    typer.echo(json.dumps(cfg, indent=2))
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
def svc_deps_cmd(
    service: str = typer.Option(..., "--service"),
    dir: str = typer.Option("configs/services", "--dir"),
):
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


@app.command("ir:kpi:compute")
def ir_kpi_compute(period: str = typer.Option(..., "--period")):
    kpi_sot.compute(period)
    typer.echo("ok")


@app.command("ir:kpi:signoff")
def ir_kpi_signoff(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    request: bool = typer.Option(False, "--request"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if request:
        kpi_signoff.request_signoff(kpi, period, as_user)
        typer.echo("requested")


@app.command("ir:kpi:approve")
def ir_kpi_approve(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    kpi_signoff.approve(kpi, period, as_user)
    typer.echo("approved")


@app.command("ir:kpi:reject")
def ir_kpi_reject(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    kpi_signoff.reject(kpi, period, as_user)
    typer.echo("rejected")


@app.command("ir:earnings:build")
def ir_earnings_build(
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option("U_IR", "--as-user"),
):
    earnings.build(period, as_user)
    typer.echo("built")


@app.command("ir:guidance")
def ir_guidance_cmd(
    period: str = typer.Option(..., "--period"),
    assumptions: Path = typer.Option(..., "--assumptions", exists=True),
):
    guidance.run(period, str(assumptions))
    typer.echo("ok")


@app.command("ir:blackouts:status")
def ir_blackouts_status(date: str = typer.Option(..., "--date")):
    typer.echo(blackouts.status(date))


@app.command("ir:disclose")
def ir_disclose(
    type: str = typer.Option(..., "--type"),
    path: Path = typer.Option(..., "--path", exists=True, dir_okay=False),
    as_user: str = typer.Option("U_IR", "--as-user"),
):
    if not as_user.startswith("U_IR"):
        raise typer.Exit(code=1)
    disclosures.log_file(type, str(path), as_user)
    typer.echo("logged")


@app.command("ir:faq")
def ir_faq(q: str = typer.Option(..., "--q"), mode: str = typer.Option("internal", "--mode")):
    typer.echo(json.dumps(faq_bot.answer(q, mode)))


@app.command("board:pack")
def board_pack_cmd(month: str = typer.Option(..., "--month")):
    board_pack.build(month)
    typer.echo("built")


@app.command("change:add")
def change_add(
    service: str = typer.Option(..., "--service"),
    type: str = typer.Option(..., "--type"),
    start: str = typer.Option(..., "--start"),
    end: str = typer.Option(..., "--end"),
    risk: str = typer.Option(..., "--risk"),
):
    cid = f"chg-{int(time.time())}"
    ch = change_calendar.Change(
        id=cid, service=service, type=type, start=start, end=end, owner="cli", risk=risk
    )
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


@app.command("close:cal:new")
def close_cal_new(
    period: str = typer.Option(..., "--period"),
    template: str = typer.Option(..., "--template"),
):
    cal = close_calendar.CloseCalendar.from_template(period, template)
    cal.save()
    typer.echo("created")


@app.command("close:cal:list")
def close_cal_list(period: str = typer.Option(..., "--period")):
    cal = close_calendar.CloseCalendar.load(period)
    for t in cal.topo_order():
        typer.echo(f"{t.id}\t{t.status}")


@app.command("close:cal:update")
def close_cal_update(
    period: str = typer.Option(..., "--period"),
    task: str = typer.Option(..., "--task"),
    status: str = typer.Option(None, "--status"),
    evidence: str = typer.Option(None, "--evidence"),
):
    cal = close_calendar.CloseCalendar.load(period)
    try:
        cal.update_task(task, status=status, evidence=evidence)
    except ValueError as e:
        typer.echo(str(e))
        raise typer.Exit(code=1)
    cal.save()
    typer.echo("updated")


@app.command("close:jrnl:propose")
def close_jrnl_propose(
    period: str = typer.Option(..., "--period"),
    rules: str = typer.Option(..., "--rules"),
):
    tb = close_journal.load_tb(period)
    journals = close_journal.propose_journals(tb, rules)
    close_journal.post(period, tb, journals)  # persist journals and adjusted tb
    typer.echo(str(len(journals)))


@app.command("close:jrnl:post")
def close_jrnl_post(period: str = typer.Option(..., "--period")):
    base = Path("artifacts/close") / period
    journals = []
    if (base / "journals.json").exists():
        data = json.loads((base / "journals.json").read_text())
        for j in data:
            lines = [close_journal.JournalLine(**ln) for ln in j["lines"]]
            journals.append(close_journal.Journal(id=j["id"], lines=lines))
    tb = close_journal.load_tb(period)
    close_journal.post(period, tb, journals)
    typer.echo("posted")


@app.command("close:recon:run")
def close_recon_run(
    period: str = typer.Option(..., "--period"),
    fixtures: str = typer.Option(..., "--fixtures"),
    config: str = typer.Option("configs/close/recons.yaml", "--config"),
):
    base = Path("artifacts/close") / period
    adj_tb_path = base / "adjusted_tb.csv"
    tb: Dict[str, float] = {}
    if adj_tb_path.exists():
        import csv

        with adj_tb_path.open() as f:
            reader = csv.DictReader(f)
            for row in reader:
                tb[row["account"]] = float(row["amount"])
    close_recon.run_recons(period, tb, config, fixtures)
    typer.echo("recons")


@app.command("close:flux")
def close_flux_cmd(
    period: str = typer.Option(..., "--period"),
    prev: str = typer.Option(..., "--prev"),
    py: str = typer.Option(..., "--py"),
    threshold: float = typer.Option(..., "--threshold"),
):
    close_flux.run_flux(period, prev, py, threshold)
    typer.echo("flux")


@app.command("close:sox:add")
def close_sox_add(
    period: str = typer.Option(..., "--period"),
    control: str = typer.Option(..., "--control"),
    path: str = typer.Option(..., "--path"),
    owner: str = typer.Option("cli", "--owner"),
):
    close_sox.add(period, control, path, owner)
    typer.echo("logged")


@app.command("close:sox:check")
def close_sox_check(period: str = typer.Option(..., "--period")):
    missing = close_sox.check(period, [])
    if missing:
        for m in missing:
            typer.echo(m)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("close:packet")
def close_packet_cmd(period: str = typer.Option(..., "--period")):
    close_packet.build_packet(period)
    typer.echo("packet")


@app.command("close:sign")
def close_sign(period: str = typer.Option(..., "--period"), role: str = typer.Option(..., "--role"), as_user: str = typer.Option(..., "--as-user")):
    try:
        close_packet.sign(period, role, as_user)
    except ValueError as e:
        typer.echo(str(e))
        raise typer.Exit(code=1)
    typer.echo("signed")

@app.command("change:conflicts")
def change_conflicts(service: str = typer.Option(..., "--service")):
    issues = change_calendar.conflicts(service)
    if issues:
        for i in issues:
            typer.echo(i)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("close:cal:new")
def close_cal_new(
    period: str = typer.Option(..., "--period"),
    template: Path = typer.Option(..., "--template", exists=True),
):
    cal = close_calendar.CloseCalendar.from_template(period, str(template))
    cal.save()
    typer.echo("ok")


@app.command("close:cal:list")
def close_cal_list(period: str = typer.Option(..., "--period")):
    cal = close_calendar.load_calendar(period)
    for t in cal.tasks:
        typer.echo(json.dumps(asdict(t)))


@app.command("close:cal:update")
def close_cal_update(
    period: str = typer.Option(..., "--period"),
    task: str = typer.Option(..., "--task"),
    status: str = typer.Option(None, "--status"),
    evidence: str = typer.Option(None, "--evidence"),
):
    cal = close_calendar.load_calendar(period)
    cal.update(task, status, evidence)
    typer.echo("updated")


@app.command("close:jrnl:propose")
def close_jrnl_propose(
    period: str = typer.Option(..., "--period"),
    rules: Path = typer.Option(..., "--rules", exists=True),
):
    close_journal.propose_journals(period, str(rules))
    typer.echo("proposed")


@app.command("close:jrnl:post")
def close_jrnl_post(period: str = typer.Option(..., "--period")):
    journals = close_journal.load_journals(period)
    close_journal.post(period, journals)
    typer.echo("posted")


@app.command("close:recon:run")
def close_recon_run(
    period: str = typer.Option(..., "--period"),
    fixtures: Path = typer.Option(..., "--fixtures", exists=True),
):
    close_recon.run_recons(period, str(fixtures))
    typer.echo("recons")


@app.command("close:flux")
def close_flux_cmd(
    period: str = typer.Option(..., "--period"),
    prev: str = typer.Option(..., "--prev"),
    py: str = typer.Option(..., "--py"),
    threshold: float = typer.Option(..., "--threshold"),
):
    close_flux.run_flux(period, prev, py, threshold)
    typer.echo("flux")


@app.command("close:sox:add")
def close_sox_add(
    period: str = typer.Option(..., "--period"),
    control: str = typer.Option(..., "--control"),
    path: str = typer.Option(..., "--path"),
    owner: str = typer.Option("cli", "--owner"),
):
    close_sox.add_evidence(period, control, path, owner)
    typer.echo("logged")


@app.command("close:sox:check")
def close_sox_check(period: str = typer.Option(..., "--period")):
    close_sox.check_evidence(period)
    typer.echo("ok")


@app.command("close:packet")
def close_packet_cmd(period: str = typer.Option(..., "--period")):
    close_packet.build_packet(period)
    typer.echo("packet")


@app.command("close:sign")
def close_sign(
    period: str = typer.Option(..., "--period"),
    role: str = typer.Option(..., "--role"),
    as_user: str = typer.Option(..., "--as-user"),
):
    close_packet.sign(period, role, as_user)
    typer.echo("signed")


@app.command("plm:items:load")
def plm_items_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    plm_bom.load_items(str(dir))
    typer.echo("ok")


@app.command("plm:bom:load")
def plm_bom_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    plm_bom.load_boms(str(dir))
    typer.echo("ok")


@app.command("plm:bom:explode")
def plm_bom_explode(
    item: str = typer.Option(..., "--item"),
    rev: str = typer.Option(..., "--rev"),
    level: int = typer.Option(1, "--level"),
):
def plm_bom_explode(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev"), level: int = typer.Option(1, "--level")):
    lines = plm_bom.explode(item, rev, level)
    for lvl, comp, qty in lines:
        typer.echo(f"{lvl}\t{comp}\t{qty}")


@app.command("plm:bom:where-used")
def plm_bom_where_used(component: str = typer.Option(..., "--component")):
    rows = plm_bom.where_used(component)
    for item_id, rev in rows:
        typer.echo(f"{item_id}\t{rev}")


@app.command("plm:eco:new")
def plm_eco_new(
    item: str = typer.Option(..., "--item"),
    from_rev: str = typer.Option(..., "--from"),
    to_rev: str = typer.Option(..., "--to"),
    reason: str = typer.Option(..., "--reason"),
):
@app.command("plm:eco:new")
def plm_eco_new(item: str = typer.Option(..., "--item"), from_rev: str = typer.Option(..., "--from"), to_rev: str = typer.Option(..., "--to"), reason: str = typer.Option(..., "--reason")):
    ch = plm_eco.new_change(item, from_rev, to_rev, reason)
    typer.echo(ch.id)


@app.command("plm:eco:impact")
def plm_eco_impact(id: str = typer.Option(..., "--id")):
    impact = plm_eco.impact(id)
    typer.echo(f"impact {impact}")


@app.command("plm:eco:approve")
def plm_eco_approve(
    id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")
):
def plm_eco_approve(id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")):
    plm_eco.approve(id, as_user)
    typer.echo("approved")


@app.command("plm:eco:release")
def plm_eco_release(id: str = typer.Option(..., "--id")):
    plm_eco.release(id)
    typer.echo("released")


@app.command("mfg:wc:load")
def mfg_wc_load(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    mfg_routing.load_work_centers(str(file))
    typer.echo("ok")


@app.command("mfg:routing:load")
def mfg_routing_load(
    dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False),
    strict: bool = typer.Option(False, "--strict"),
):
    mfg_routing.load_routings(str(dir), strict)
def mfg_routing_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    mfg_routing.load_routings(str(dir))
    typer.echo("ok")


@app.command("mfg:routing:capcheck")
def mfg_routing_capcheck(
    item: str = typer.Option(..., "--item"),
    rev: str = typer.Option(..., "--rev"),
    qty: int = typer.Option(..., "--qty"),
):
def mfg_routing_capcheck(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev"), qty: int = typer.Option(..., "--qty")):
    res = mfg_routing.capacity_check(item, rev, qty)
    typer.echo(json.dumps(res))


@app.command("mfg:wi:render")
def mfg_wi_render(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev")):
    path = mfg_wi.render(item, rev)
    typer.echo(str(path))


@app.command("mfg:spc:analyze")
def mfg_spc_analyze(
    op: str = typer.Option(..., "--op"), window: int = typer.Option(50, "--window")
):
    report = mfg_spc.analyze(op, window)
    if report["findings"]:
        typer.echo(" ".join(report["findings"]))
    else:
        typer.echo("OK")
def mfg_spc_analyze(op: str = typer.Option(..., "--op"), window: int = typer.Option(50, "--window")):
    findings = mfg_spc.analyze(op, window)
    typer.echo(" ".join(findings))


@app.command("mfg:yield")
def mfg_yield_cmd(period: str = typer.Option(..., "--period")):
    stats = mfg_yield.compute(period)
    typer.echo(json.dumps(stats))


@app.command("mfg:coq")
def mfg_coq_cmd(period: str = typer.Option(..., "--period")):
    totals = mfg_coq.build(period)
    typer.echo(json.dumps(totals))


@app.command("mfg:mrp")
def mfg_mrp_cmd(
    demand: Path = typer.Option(..., "--demand", exists=True),
    inventory: Path = typer.Option(..., "--inventory", exists=True),
    pos: Path = typer.Option(..., "--pos", exists=True),
):
    plan = mfg_mrp.plan(str(demand), str(inventory), str(pos))
    typer.echo(json.dumps(plan))


@app.command("learn:courses:load")
def learn_courses_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    en_courses.load_courses(str(dir))
    typer.echo("ok")


@app.command("learn:courses:list")
def learn_courses_list(role_track: str = typer.Option(..., "--role_track")):
    for c in en_courses.list_courses(role_track):
        typer.echo(f"{c['id']}	{c['title']}")


@app.command("learn:path:new")
def learn_path_new(
    name: str = typer.Option(..., "--name"),
    role_track: str = typer.Option(..., "--role_track"),
    courses: str = typer.Option(..., "--courses"),
    required: int = typer.Option(..., "--required"),
):
    p = en_paths.new_path(name, role_track, courses.split(","), required)
    typer.echo(p.id)


@app.command("learn:assign")
def learn_assign(
    user: str = typer.Option(..., "--user"),
    path: str = typer.Option(..., "--path"),
    due: str = typer.Option(..., "--due"),
):
    en_paths.assign(user, path, due)
    typer.echo("ok")


@app.command("learn:quiz:grade")
def learn_quiz_grade(
    quiz: str = typer.Option(..., "--quiz"),
    answers: Path = typer.Option(..., "--answers", exists=True),
):
    res = en_quizzes.grade(quiz, str(answers))
    typer.echo(json.dumps(res))


@app.command("learn:lab:run")
def learn_lab_run(
    lab: str = typer.Option(..., "--lab"),
    submission: Path = typer.Option(..., "--submission", exists=True),
):
    res = en_labs.run_lab(lab, str(submission))
    typer.echo(json.dumps(res))


@app.command("learn:cert:check")
def learn_cert_check(
    user: str = typer.Option(..., "--user"), cert: str = typer.Option(..., "--cert")
):
    ok = en_cert.check(user, cert)
    typer.echo("awarded" if ok else "not met")


@app.command("learn:cert:list")
def learn_cert_list(user: str = typer.Option(..., "--user")):
    for c in en_cert.list_user(user):
        typer.echo(c)


@app.command("learn:readiness")
def learn_readiness():
    en_read.build()
    typer.echo("ok")


@app.command("learn:event:add")
def learn_event_add(
    title: str = typer.Option(..., "--title"),
    type: str = typer.Option(..., "--type"),
    date: str = typer.Option(..., "--date"),
    capacity: int = typer.Option(..., "--capacity"),
):
    ev = en_cal.add_event(title, type, date, capacity)
    typer.echo(ev.id)


@app.command("learn:event:join")
def learn_event_join(id: str = typer.Option(..., "--id"), user: str = typer.Option(..., "--user")):
    en_cal.join(id, user)
    typer.echo("ok")


@app.command("learn:feedback:add")
def learn_feedback_add(
    course: str = typer.Option(..., "--course"),
    user: str = typer.Option(..., "--user"),
    score: int = typer.Option(..., "--score"),
    comment: str = typer.Option(..., "--comment"),
):
    en_fb.add(course, user, score, comment)
    typer.echo("ok")


@app.command("learn:feedback:summary")
def learn_feedback_summary(course: str = typer.Option(..., "--course")):
    res = en_fb.summary(course)
    typer.echo(json.dumps(res))

@app.command("mdm:stage")
def mdm_stage(domain: str = typer.Option(..., "--domain"), file: Path = typer.Option(..., "--file", exists=True)):
    mdm_domains.stage(domain, file)
    typer.echo("staged")


@app.command("mdm:match")
def mdm_match_cmd(domain: str = typer.Option(..., "--domain"), config: Path = typer.Option(..., "--config", exists=True)):
    mdm_match.match(domain, config)
    typer.echo("matched")


@app.command("mdm:golden")
def mdm_golden(domain: str = typer.Option(..., "--domain"), policy: Path = typer.Option(..., "--policy", exists=True)):
    mdm_survivorship.merge(domain, policy)
    typer.echo("golden")


@app.command("mdm:dq")
def mdm_dq_cmd(domain: str = typer.Option(..., "--domain"), config: Path = typer.Option(..., "--config", exists=True)):
    mdm_quality.dq(domain, config)
    typer.echo("dq")


@app.command("mdm:catalog:build")
def mdm_catalog_build():
    mdm_catalog.build()
    typer.echo("catalog")


@app.command("mdm:steward:queue")
def mdm_steward_queue(domain: str = typer.Option(..., "--domain")):
    mdm_steward.queue(domain)
    typer.echo("queued")


@app.command("mdm:lineage:diff")
def mdm_lineage_diff_cmd(domain: str = typer.Option(..., "--domain")):
    mdm_lineage_diff.diff(domain)
    typer.echo("diff")


@app.command("mdm:change:new")
def mdm_change_new(domain: str = typer.Option(..., "--domain"), type: str = typer.Option(..., "--type"), payload: Path = typer.Option(..., "--payload", exists=True)):
    chg = mdm_changes.new(domain, type, payload)
    typer.echo(chg.id)


@app.command("mdm:change:approve")
def mdm_change_approve(id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")):
    mdm_changes.approve(id, as_user)
    typer.echo("approved")


@app.command("mdm:change:apply")
def mdm_change_apply(id: str = typer.Option(..., "--id")):
    mdm_changes.apply(id)
    typer.echo("applied")

@app.command("status:build")
def status_build():
    try:
        blackouts.enforce("status:build")
    except PermissionError as e:
        typer.echo(str(e))
        raise typer.Exit(code=1)
    status_gen.build()
    typer.echo("built")
@app.command("aiops:correlate")
def aiops_correlate():
    aiops_correlation.correlate(datetime.utcnow())


@app.command("aiops:plan")
def aiops_plan(correlations: str = typer.Option(..., "--correlations")):
    corr = aiops_remediation.load_correlations(correlations)
    aiops_remediation.plan(corr)


@app.command("aiops:execute")
def aiops_execute(
    plan: Path = typer.Option(..., "--plan", exists=True, dir_okay=False),
    dry_run: bool = typer.Option(False, "--dry-run"),
):
    aiops_remediation.execute(plan, dry_run)


@app.command("aiops:canary")
def aiops_canary_cmd(
    base: Path = typer.Option(..., "--base", exists=True, dir_okay=False),
    canary: Path = typer.Option(..., "--canary", exists=True, dir_okay=False),
):
    aiops_canary.analyze(base, canary)


@app.command("aiops:baseline:record")
def aiops_baseline_record():
    aiops_drift.record_baseline({})


@app.command("aiops:drift:check")
def aiops_drift_check():
    aiops_drift.compare()


@app.command("aiops:budget")
def aiops_budget_cmd(service: str = typer.Option(..., "--service"), window: str = typer.Option(..., "--window")):
    aiops_budget.budget_status(service, window)


@app.command("aiops:window")
def aiops_window(service: str = typer.Option(..., "--service"), action: str = typer.Option(..., "--action")):
    w = aiops_maintenance.next_window(service, action)
    typer.echo(json.dumps(w) if w else "null")
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
@app.command("preflight:check")
def preflight_check():
    require = os.getenv("REQUIRE_SIGNED_ARTIFACTS", "False") == "True"
    wheels_dir = ROOT / "dist" / "wheels"
    sha_file = wheels_dir / "SHA256SUMS"
    if require and not sha_file.exists():
        typer.echo("signatures missing")
        raise typer.Exit(code=1)
    typer.echo("preflight ok")


@app.command("integrity:verify")
def integrity_verify():
    try:
        subprocess.check_call([sys.executable, "build/signing/verify_wheels.py"])
        subprocess.check_call([sys.executable, "build/sbom.py"])
        subprocess.check_call(
            [
                "gpg",
                "--batch",
                "--verify",
                "dist/attestation.json.asc",
                "dist/attestation.json",
            ],
            env={"GNUPGHOME": str(ROOT / "build" / "signing" / "gnupg")},
        )
    except subprocess.CalledProcessError:
        typer.echo("FAIL")
        raise typer.Exit(code=1)
    typer.echo("PASS")


@app.command("policy:license-check")
def policy_license_check():
    try:
        subprocess.check_call([sys.executable, "build/licenses.py"])
    except subprocess.CalledProcessError:
        raise typer.Exit(code=1)
    typer.echo("OK")


@app.command("version:show")
def version_show():
    from importlib.metadata import version

    typer.echo(version("blackroad-prism-console"))
@app.command("twin:checkpoint")
def twin_checkpoint(name: str = typer.Option(..., "--name")):
    path = snapshots.create_checkpoint(name)
    typer.echo(path)
@app.command("twin:checkpoint")
def twin_checkpoint(name: str = typer.Option(..., "--name")):
    snapshots.create_checkpoint(name)
    typer.echo(name)


@app.command("twin:list")
def twin_list():
    for info in snapshots.list_checkpoints():
        typer.echo(f"{info['name']}\t{info['created_at']}")
    for cp in snapshots.list_checkpoints():
        typer.echo(cp["name"])


@app.command("twin:restore")
def twin_restore(name: str = typer.Option(..., "--name")):
    snapshots.restore_checkpoint(name)
    typer.echo("restored")


@app.command("twin:replay")
def twin_replay(
    range_from: Optional[str] = typer.Option(None, "--from"),
    range_to: Optional[str] = typer.Option(None, "--to"),
    mode: str = typer.Option("verify", "--mode"),
):
    report = replay.replay(range_from, range_to, mode=mode)
    typer.echo(str(report))


@app.command("twin:stress")
def twin_stress(
    profile: str = typer.Option("default", "--profile"),
    duration: int = typer.Option(60, "--duration"),
):
    prof = stress.load_profile(profile)
    stress.run_load(prof, duration)
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
def twin_compare(
    left: str = typer.Option(..., "--left"),
    right: str = typer.Option(..., "--right"),
):
    res = compare.compare_runs(left, right)
    typer.echo(str(res))


if __name__ == "__main__":

@app.command("rnd:idea:new")
def rnd_idea_new(title: str = typer.Option(..., "--title"), problem: str = typer.Option(..., "--problem"), solution: str = typer.Option(..., "--solution"), owner: str = typer.Option(..., "--owner"), tags: str = typer.Option("", "--tags"), status: str = typer.Option("new", "--status")):
    idea = rnd_ideas.new(title, problem, solution, owner, [t.strip() for t in tags.split(",") if t.strip()], status)
    typer.echo(idea.id)


@app.command("rnd:idea:score")
def rnd_idea_score(id: str = typer.Option(..., "--id")):
    idea = next((i for i in rnd_ideas.list() if i.id == id), None)
    if not idea:
        raise typer.Exit(code=1)
    typer.echo(str(rnd_ideas.score(idea)))


@app.command("rnd:idea:list")
def rnd_idea_list(status: Optional[str] = typer.Option(None, "--status")):
    for i in rnd_ideas.list(status):
        typer.echo(f"{i.id}\t{i.title}\t{i.status}")


@app.command("rnd:exp:design")
def rnd_exp_design(idea: str = typer.Option(..., "--idea"), hypothesis: str = typer.Option(..., "--hypothesis"), method: str = typer.Option(..., "--method")):
    exp = rnd_exp.design(idea, hypothesis, method)
    typer.echo(exp.id)


@app.command("rnd:exp:run")
def rnd_exp_run_cmd(id: str = typer.Option(..., "--id")):
    rnd_exp.run(id)
    typer.echo("ran")


@app.command("rnd:exp:decide")
def rnd_exp_decide(id: str = typer.Option(..., "--id"), decision: str = typer.Option(..., "--decision"), reason: str = typer.Option(..., "--reason")):
    rnd_exp.decide(id, decision, reason)
    typer.echo("ok")


@app.command("rnd:radar:build")
def rnd_radar_build():
    rnd_radar.build()
    typer.echo("built")


@app.command("rnd:radar:add")
def rnd_radar_add(tech: str = typer.Option(..., "--tech"), ring: str = typer.Option(..., "--ring"), quadrant: str = typer.Option(..., "--quadrant"), rationale: str = typer.Option(..., "--rationale")):
    rnd_radar.add(tech, ring, quadrant, rationale)
    typer.echo("added")


@app.command("rnd:radar:list")
def rnd_radar_list(quadrant: Optional[str] = typer.Option(None, "--quadrant")):
    for e in rnd_radar.list(quadrant):
        typer.echo(f"{e.tech}\t{e.ring}\t{e.quadrant}")


@app.command("rnd:ip:new")
def rnd_ip_new(idea: str = typer.Option(..., "--idea"), title: str = typer.Option(..., "--title"), inventors: str = typer.Option(..., "--inventors"), jurisdictions: str = typer.Option(..., "--jurisdictions")):
    disc = rnd_ip.new(idea, title, inventors.split(","), jurisdictions.split(","))
    typer.echo(disc.id)


@app.command("rnd:ip:update")
def rnd_ip_update(id: str = typer.Option(..., "--id"), status: str = typer.Option(..., "--status")):
    rnd_ip.update(id, status)
    typer.echo("ok")


@app.command("rnd:notes:index")
def rnd_notes_index_cmd():
    rnd_notes.index()
    typer.echo("indexed")


@app.command("rnd:notes:link")
def rnd_notes_link(idea: str = typer.Option(..., "--idea"), note: Path = typer.Option(..., "--note", exists=True)):
    rnd_notes.link(idea, str(note))
    typer.echo("linked")


@app.command("rnd:merge")
def rnd_merge_cmd(idea: str = typer.Option(..., "--idea")):
    rnd_merge.merge(idea)
    typer.echo("merged")


@app.command("rnd:dashboard")
def rnd_dashboard_cmd():
    rnd_dashboard.build()
    typer.echo("built")


# Legal Ops -----------------------------------------------------------------


@app.command("legal:contract:new")
def legal_contract_new(type: str = typer.Option(..., "--type"), counterparty: str = typer.Option(..., "--counterparty")):
    c = clm.create(type, counterparty)
    typer.echo(c.id)


@app.command("legal:contract:route")
def legal_contract_route(id: str = typer.Option(..., "--id"), to_role: str = typer.Option(..., "--to-role")):
    clm.route_for_review(id, to_role)
    typer.echo("routed")


@app.command("legal:contract:approve")
def legal_contract_approve(id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")):
    clm.approve(id, as_user)
    typer.echo("approved")


@app.command("legal:contract:execute")
def legal_contract_execute(id: str = typer.Option(..., "--id"), date: str = typer.Option(..., "--date")):
    clm.execute(id, date)
    typer.echo("executed")


@app.command("legal:approve:request")
def legal_approve_request(id: str = typer.Option(..., "--id"), for_role: str = typer.Option(..., "--for-role"), note: str = typer.Option("", "--note")):
    clm.route_for_review(id, for_role)
    typer.echo("requested")


@app.command("legal:esign")
def legal_esign(id: str = typer.Option(..., "--id"), user: str = typer.Option(..., "--user"), text: str = typer.Option(..., "--text")):
    clm.esign(id, user, text)
    typer.echo("signed")


@app.command("legal:clauses:list")
def legal_clauses_list(tag: str = typer.Option(None, "--tag")):
    for c in clauses.load_clauses(tag):
        typer.echo(c["id"])


@app.command("legal:assemble")
def legal_assemble(template: str = typer.Option(..., "--template"), options: Path = typer.Option(..., "--options", exists=True, dir_okay=False), out: Path = typer.Option(..., "--out")):
    doc, _ = clauses.assemble(template, str(options))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)
    typer.echo(str(out))


@app.command("legal:redline")
def legal_redline_cmd(old: Path = typer.Option(..., "--old"), new: Path = typer.Option(..., "--new")):
    diff = redline.write_redline(str(old), str(new), str(ROOT / "artifacts" / "legal" / "redlines" / f"{new.stem}_vs_{old.stem}"))
    typer.echo(json.dumps(diff))


@app.command("legal:obligations:extract")
def legal_obligations_extract(id: str = typer.Option(..., "--id")):
    obs = obligations.extract(id)
    typer.echo(json.dumps(obs))


@app.command("legal:obligations:list")
def legal_obligations_list(due_within: int = typer.Option(None, "--due-within")):
    obs = obligations.list_obligations(due_within)
    for ob in obs:
        typer.echo(json.dumps(ob))


@app.command("legal:calendar:build")
def legal_calendar_build():
    items = compliance_calendar.build()
    typer.echo(len(items))


@app.command("legal:calendar:list")
def legal_calendar_list(from_date: str = typer.Option(..., "--from"), to_date: str = typer.Option(..., "--to")):
    items = compliance_calendar.list_items(from_date, to_date)
    for it in items:
        typer.echo(json.dumps(it))


@app.command("legal:export:screen")
def legal_export_screen(partner: str = typer.Option(..., "--partner"), order: Path = typer.Option(..., "--order", exists=True, dir_okay=False)):
    res = export_controls.screen(partner, str(order))
    typer.echo(json.dumps(res))


@app.command("legal:dataroom:build")
def legal_dataroom_build(include: str = typer.Option(..., "--include")):
    includes = [s.strip() for s in include.split(",") if s.strip()]
    manifest = data_room.build(includes)
    typer.echo(len(manifest))



# Strategy commands

@app.command("okr:new:obj")
def okr_new_obj(level: str = typer.Option(..., "--level"), owner: str = typer.Option(..., "--owner"), period: str = typer.Option(..., "--period"), text: str = typer.Option(..., "--text")):
    obj = strat_okr.new_objective(level, owner, period, text)
    typer.echo(obj.id)


@app.command("okr:new:kr")
def okr_new_kr(obj: str = typer.Option(..., "--obj"), metric: str = typer.Option(..., "--metric"), target: float = typer.Option(..., "--target"), unit: str = typer.Option(..., "--unit"), scoring: str = typer.Option(..., "--scoring")):
    kr = strat_okr.new_key_result(obj, metric, target, unit, scoring)
    typer.echo(kr.id)


@app.command("okr:link")
def okr_link(child: str = typer.Option(..., "--child"), parent: str = typer.Option(..., "--parent")):
    strat_okr.link(child, parent)
    typer.echo("linked")


@app.command("okr:validate")
def okr_validate(period: str = typer.Option(..., "--period")):
    ok = strat_okr.validate(period)
    typer.echo("ok" if ok else "invalid")


@app.command("bets:new")
def bets_new(title: str = typer.Option(..., "--title"), owner: str = typer.Option(..., "--owner"), period: str = typer.Option(..., "--period"), est_cost: float = typer.Option(..., "--est_cost"), est_impact: float = typer.Option(..., "--est_impact"), risk: str = typer.Option(..., "--risk"), ttv: int = typer.Option(..., "--ttv")):
    bet = strat_bets.new_bet(title, owner, period, est_cost, est_impact, risk, ttv)
    typer.echo(bet.id)


@app.command("bets:rank")
def bets_rank(period: str = typer.Option(..., "--period"), scoring: Path = typer.Option(..., "--scoring", exists=False)):
    strat_bets.rank(period, scoring)
    typer.echo("ranked")


@app.command("scorecard:build")
def scorecard_build(period: str = typer.Option(..., "--period"), level: str = typer.Option(..., "--level"), owner: str = typer.Option(..., "--owner")):
    strat_scorecard.build(period, level, owner)
    typer.echo("built")


@app.command("review:prepare")
def review_prepare(date: str = typer.Option(..., "--date")):
    strat_reviews.prepare(date)
    typer.echo("prepared")


@app.command("review:packet")
def review_packet(date: str = typer.Option(..., "--date")):
    strat_reviews.packet(date)
    typer.echo("packet")


@app.command("tradeoff:select")
def tradeoff_select(period: str = typer.Option(..., "--period"), budget: float = typer.Option(..., "--budget")):
    strat_tradeoffs.select(period, budget)
    typer.echo("selected")


@app.command("tradeoff:frontier")
def tradeoff_frontier(period: str = typer.Option(..., "--period")):
    strat_tradeoffs.frontier(period)
    typer.echo("frontier")


@app.command("memo:build")
def memo_build(period: str = typer.Option(..., "--period"), theme: str = typer.Option(..., "--theme")):
    strat_memos.build(period, theme)
    typer.echo("memo")
def _record_event(name: str, meta: dict) -> None:
    path = ARTIFACTS / "events.log"
    entry = {"event": name, **meta, "ts": datetime.utcnow().isoformat()}
    storage.write(str(path), json.dumps(entry))


@app.command("sop:reconcile")
def sop_reconcile(
    demand: Path = typer.Option(..., "--demand", exists=True),
    supply: Path = typer.Option(..., "--supply", exists=True),
    policy: Path = typer.Option(..., "--policy", exists=True),
):
    with open(demand, newline="", encoding="utf-8") as f:
        rd = list(csv.DictReader(f))
    demand_objs = [sop_plan.DemandSignal(**{k: r[k] for k in r}) for r in rd]
    with open(supply, newline="", encoding="utf-8") as f:
        rs = list(csv.DictReader(f))
    supply_objs = [sop_plan.SupplyPlan(**{k: r[k] for k in r}) for r in rs]
    pol = yaml.safe_load(policy.read_text())
    result = sop_plan.reconcile(demand_objs, supply_objs, pol)
    out_dir = ARTIFACTS / "sop"
    out_dir.mkdir(parents=True, exist_ok=True)
    alloc_path = out_dir / "allocations.csv"
    with open(alloc_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["region", "units"])
        writer.writeheader()
        for row in result["allocations"]:
            writer.writerow(row)
    _record_event("sop_reconcile", {"allocations": str(alloc_path)})
    typer.echo(json.dumps(result))


@app.command("inv:simulate")
def inv_simulate(
    params: Path = typer.Option(..., "--params", exists=True),
    horizon: int = typer.Option(..., "--horizon"),
):
    p = yaml.safe_load(params.read_text())
    summary = inventory_sim.simulate(p, horizon)
    ts_dir = ARTIFACTS / "supply" / f"inv_sim_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    ts_dir.mkdir(parents=True, exist_ok=True)
    (ts_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
    _record_event("inv_sim_run", {"summary": str(ts_dir / "summary.json")})
    typer.echo(json.dumps(summary))


@app.command("log:optimize")
def log_optimize(
    demand: Path = typer.Option(..., "--demand", exists=True),
    lanes: Path = typer.Option(..., "--lanes", exists=True),
    constraints: Path = typer.Option(..., "--constraints", exists=True),
):
    with open(demand, newline="", encoding="utf-8") as f:
        allocations = list(csv.DictReader(f))
    demand_allocs = [{"region": r["region"], "units": int(r["units"])} for r in allocations]
    with open(lanes, newline="", encoding="utf-8") as f:
        lane_rows = list(csv.DictReader(f))
    lane_objs = [
        logistics.Lane(
            origin=r["origin"],
            dest=r["dest"],
            mode=r["mode"],
            base_rate=float(r["base_rate"]),
            fuel_adj=float(r["fuel_adj"]),
            lead_time=int(r["lead_time"]),
        )
        for r in lane_rows
    ]
    cons = yaml.safe_load(constraints.read_text())
    plan = logistics.optimize_lanes(demand_allocs, lane_objs, cons)
    ts_dir = ARTIFACTS / "supply" / f"log_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    ts_dir.mkdir(parents=True, exist_ok=True)
    (ts_dir / "plan.json").write_text(json.dumps(plan), encoding="utf-8")
    _record_event("log_opt_run", {"plan": str(ts_dir / "plan.json")})
    if plan["sla_hit_pct"] < cons.get("sla_target", 0):
        typer.echo("DUTY_SLA")
        raise typer.Exit(code=1)
    typer.echo(json.dumps(plan))


@app.command("procure:award")
def procure_award(
    demand: Path = typer.Option(..., "--demand", exists=True),
    suppliers: Path = typer.Option(..., "--suppliers", exists=True),
    policy: Path = typer.Option(..., "--policy", exists=True),
):
    with open(demand, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    dem = {}
    for r in rows:
        dem[r.get("sku", "sku")] = dem.get(r.get("sku", "sku"), 0) + int(r["units"])
    with open(suppliers, newline="", encoding="utf-8") as f:
        supplier_rows = list(csv.DictReader(f))
    supplier_objs = [
        procure_opt.Supplier(
            supplier=r["supplier"],
            sku=r["sku"],
            unit_price=float(r["unit_price"]),
            moq=int(r["moq"]),
            lead_time=int(r["lead_time"]),
            defect_ppm=int(r["defect_ppm"]),
        )
        for r in supplier_rows
    ]
    pol = yaml.safe_load(policy.read_text())
    award = procure_opt.choose_mix(dem, supplier_objs, pol)
    out = ARTIFACTS / "procure"
    out.mkdir(parents=True, exist_ok=True)
    json_path = out / "award.json"
    json_path.write_text(json.dumps(award), encoding="utf-8")
    _record_event("procure_award", {"award": str(json_path)})
    if pol.get("dual_source_min_pct", 0) > 0 and len(award["awards"]) < 2:
        typer.echo("POLICY_AWARD_DUALSOURCE")
        raise typer.Exit(code=1)
    typer.echo(json.dumps(award))


@app.command("wc:simulate")
def wc_simulate(
    demand: Path = typer.Option(..., "--demand", exists=True),
    awards: Path = typer.Option(..., "--awards", exists=True),
    log: Path = typer.Option(..., "--log", exists=True),
    terms: Path = typer.Option(..., "--terms", exists=True),
):
    with open(demand, newline="", encoding="utf-8") as f:
        demand_rows = list(csv.DictReader(f))
    dem = [{"units": int(r["units"])} for r in demand_rows]
    awards_data = json.loads(awards.read_text())["awards"]
    log_plan = json.loads(Path(log).read_text())
    terms_data = yaml.safe_load(terms.read_text())
    res = finance_wc.cash_cycle(dem, awards_data, log_plan, terms_data)
    out_dir = ARTIFACTS / "finance" / f"wc_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "summary.json").write_text(json.dumps(res), encoding="utf-8")
    _record_event("wc_model_run", {"summary": str(out_dir / "summary.json")})
    typer.echo(json.dumps(res))


@app.command("dash:scopsfin")
def dash_scopsfin():
    metrics = {}
    sop_path = ARTIFACTS / "sop" / "allocations.csv"
    if sop_path.exists():
        with open(sop_path, newline="", encoding="utf-8") as f:
            total = sum(int(r["units"]) for r in csv.DictReader(f))
        metrics["allocations"] = total
    inv_glob = list((ARTIFACTS / "supply").glob("inv_sim_*/summary.json"))
    if inv_glob:
        metrics.update(json.loads(inv_glob[-1].read_text()))
    wc_glob = list((ARTIFACTS / "finance").glob("wc_*/summary.json"))
    if wc_glob:
        metrics.update(json.loads(wc_glob[-1].read_text()))
    sc_ops_fin.build(metrics)
    _record_event("dash_sc_ops_fin_built", {})
    typer.echo("dashboard built")


@app.command("mkt:segments:build")
def mkt_segments_build(config: str = typer.Option(..., "--config")):
    segs = mkt_segments.build_segments(config)
    typer.echo(json.dumps(segs))


@app.command("mkt:leadscore")
def mkt_leadscore(config: str = typer.Option(..., "--config")):
    scores = mkt_lead.score_leads(config)
    typer.echo(json.dumps(scores))


@app.command("mkt:attr")
def mkt_attr_cmd(model: str = typer.Option("linear", "--model")):
    mkt_attr.run_attribution(model)
    typer.echo("ok")


@app.command("mkt:seo:audit")
def mkt_seo_cmd(site: str = typer.Option(..., "--site")):
    res = mkt_seo.audit_site(site)
    typer.echo(json.dumps(res))


@app.command("mkt:social:queue")
def mkt_social_queue(channel: str = typer.Option(..., "--channel"), text: str = typer.Option(..., "--text")):
    post = mkt_social.queue_post(channel, text)
    typer.echo(post.id)


@app.command("mkt:social:run")
def mkt_social_run(dry_run: bool = typer.Option(False, "--dry-run")):
    mkt_social.run_queue(dry_run)
    typer.echo("done")


@app.command("mkt:cal:add")
def mkt_cal_add(title: str = typer.Option(..., "--title"), type: str = typer.Option(..., "--type"), due: str = typer.Option(..., "--due"), owner: str = typer.Option(..., "--owner")):
    item = mkt_cal.add_item(title, type, due, owner)
    typer.echo(item["id"])


@app.command("mkt:cal:view")
def mkt_cal_view(month: str = typer.Option(..., "--month")):
    txt = mkt_cal.view_month(month)
    typer.echo(txt)


@app.command("mkt:creative:variants")
def mkt_creative_variants(in_path: str = typer.Option(..., "--in"), out: str = typer.Option(..., "--out")):
    mkt_creatives.generate_variants(in_path, out)
    typer.echo("ok")


@app.command("mkt:dashboard")
def mkt_dashboard_cmd():
    mkt_dash.build_dashboard()
    typer.echo("built")


@app.command("mkt:campaign:new")
def mkt_campaign_new(id: str = typer.Option(..., "--id"), channel: str = typer.Option(..., "--channel"), segment: str = typer.Option(..., "--segment"), creatives: str = typer.Option(..., "--creatives")):
    mkt_campaigns.new_campaign(id, channel, segment, [creatives])
    typer.echo("ok")


@app.command("mkt:campaign:validate")
def mkt_campaign_validate(id: str = typer.Option(..., "--id")):
    mkt_campaigns.validate_campaign(id)
    typer.echo("ok")
    from bots import BOT_REGISTRY

    for name, bot in BOT_REGISTRY.items():
        typer.echo(f"{name}")
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


def main():
    app()
import argparse
import json
from pathlib import Path

from samples import gen as sample_gen

COOKBOOK_DIR = Path("cookbook/tasks")
ARTIFACT_DIR = Path("artifacts/cookbook")


def _list_cookbook():
    return [p.stem for p in COOKBOOK_DIR.glob("*.md")]


def cmd_samples(args):
    sample_gen.main(args.overwrite)
    print("samples generated at", sample_gen.GENERATED_DIR)


def cmd_bot(args):
    print(f"running bot {args.bot} for goal '{args.goal}'")


def _parse_context(text: str) -> dict:
    import re

    match = re.search(r"```json\n(.*?)\n```", text, re.S)
    if match:
        return json.loads(match.group(1))
    return {}


def cmd_cookbook(args):
    slug = args.name
    path = COOKBOOK_DIR / f"{slug}.md"
    if not path.exists():
        print("unknown cookbook name", slug)
        print("available:", ", ".join(_list_cookbook()))
        return
    text = path.read_text()
    context = _parse_context(text)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = ARTIFACT_DIR / f"{slug}.json"
    with out_path.open("w") as f:
        json.dump({"goal": slug, "context": context}, f, indent=2)
    print(out_path)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    p_samples = sub.add_parser("samples:gen")
    p_samples.add_argument("--overwrite", action="store_true")
    p_samples.set_defaults(func=cmd_samples)

    p_bot = sub.add_parser("bot:run")
    p_bot.add_argument("--bot", required=True)
    p_bot.add_argument("--goal", required=True)
    p_bot.set_defaults(func=cmd_bot)

    p_cb = sub.add_parser("cookbook:run")
    p_cb.add_argument("--name")
    p_cb.set_defaults(func=cmd_cookbook)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
from __future__ import annotations

import argparse
import json
import sys

from orchestrator import audit, approvals, tasks
from orchestrator.exceptions import BotExecutionError
from security import rbac
from security.rbac import APPROVAL_DECIDE, APPROVAL_REQUEST, TASK_CREATE, TASK_ROUTE
from tools import storage

BOTS = ["Treasury-BOT", "Change/Release-BOT", "SRE-BOT"]


def parse_user(user_id: str) -> rbac.User:
    return rbac.rbac.get_user(user_id)


def cmd_bot_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    for b in BOTS:
        print(b)


@rbac.require([TASK_CREATE])
def cmd_task_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    context = {}
    if args.context:
        context = storage.read_json(args.context, from_data=False)
    task = tasks.create_task(args.goal, context, user=user)
    print(task.id)


@rbac.require([TASK_ROUTE])
def cmd_task_route(args: argparse.Namespace, *, user: rbac.User) -> None:
    try:
        task = tasks.route_task(args.id, args.bot, user=user)
        print(task.status)
    except BotExecutionError as e:
        print(str(e))
        sys.exit(1)


@rbac.require([APPROVAL_REQUEST])
def cmd_approval_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.create_approval(args.task, user.id, args.for_role)
    print(req.id)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_decide(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.decide(args.id, args.decision, user.id, args.reason)
    print(req.status)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    items = approvals.list_approvals(args.status)
    for item in items:
        print(json.dumps(item.__dict__))


@rbac.require([rbac.ADMIN])
def cmd_audit_verify(args: argparse.Namespace, *, user: rbac.User) -> None:
    bad = audit.verify_log()
    if bad:
        print("invalid signatures at lines", bad)
        sys.exit(1)
    print("all signatures valid")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")

    def add_user(sp: argparse.ArgumentParser) -> None:
        sp.add_argument("--as-user", dest="as_user", default="U_SYS")

    sub_bot = sub.add_parser("bot:list")
    add_user(sub_bot)
    sub_bot.set_defaults(func=cmd_bot_list)

    sub_create = sub.add_parser("task:create")
    add_user(sub_create)
    sub_create.add_argument("--goal", required=True)
    sub_create.add_argument("--context")
    sub_create.set_defaults(func=cmd_task_create)

    sub_route = sub.add_parser("task:route")
    add_user(sub_route)
    sub_route.add_argument("--id", required=True)
    sub_route.add_argument("--bot", required=True)
    sub_route.set_defaults(func=cmd_task_route)

    sub_acreate = sub.add_parser("approval:create")
    add_user(sub_acreate)
    sub_acreate.add_argument("--task", required=True)
    sub_acreate.add_argument("--for-role", dest="for_role", required=True)
    sub_acreate.set_defaults(func=cmd_approval_create)

    sub_alist = sub.add_parser("approval:list")
    add_user(sub_alist)
    sub_alist.add_argument("--status")
    sub_alist.set_defaults(func=cmd_approval_list)

    sub_adecide = sub.add_parser("approval:decide")
    add_user(sub_adecide)
    sub_adecide.add_argument("--id", required=True)
    sub_adecide.add_argument("--decision", required=True)
    sub_adecide.add_argument("--reason")
    sub_adecide.set_defaults(func=cmd_approval_decide)

    sub_verify = sub.add_parser("audit:verify")
    add_user(sub_verify)
    sub_verify.set_defaults(func=cmd_audit_verify)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    user = parse_user(args.as_user)
    try:
        if not args.cmd:
            parser.print_help()
            return 0
        args.func(args, user=user)
        return 0
    except rbac.PermissionError as e:
        print(str(e))
        return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
@app.command("kg:stats")
def kg_stats():
    kg = KnowledgeGraph()
    labels: Dict[str, int] = {}
    for node in kg.nodes.values():
        labels[node["label"]] = labels.get(node["label"], 0) + 1
    edges: Dict[str, int] = {}
    for e in kg.edges.values():
        for etype, targets in e.items():
            edges[etype] = edges.get(etype, 0) + len(targets)
    typer.echo(json.dumps({"nodes": labels, "edges": edges}))


@app.command("kg:query")
def kg_query(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    text = Path(file).read_text()
    res = kql_run(text)
    typer.echo(json.dumps(res))


@app.command("kg:neighbors")
def kg_neighbors(
    id: str = typer.Option(..., "--id"), edge: Optional[str] = typer.Option(None, "--edge")
):
    kg = KnowledgeGraph()
    for n in kg.neighbors(id, edge):
        typer.echo(n)


@app.command("kg:rules")
def kg_rules_cmd(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    findings = run_rules(str(file))
    typer.echo(json.dumps([f.__dict__ for f in findings]))


@app.command("chain:run")
def chain_run(plan: Path = typer.Option(..., "--plan", exists=True, dir_okay=False)):
    data = yaml.safe_load(Path(plan).read_text())
    steps: List[PlanStep] = [PlanStep(**s) for s in data.get("steps", [])]
    execute_plan(steps)


def twin_compare_cmd(
    left: Path = typer.Option(..., "--left"),
    right: Path = typer.Option(..., "--right"),
):
    twin_compare.compare_runs(str(left), str(right))
    typer.echo("ok")
# partner catalog commands
@app.command("partner:load")
def partner_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    partner_catalog.load_catalog(dir)


@app.command("partner:list")
def partner_list(
    tier: Optional[str] = typer.Option(None, "--tier"),
    region: Optional[str] = typer.Option(None, "--region"),
):
    for p in partner_catalog.list_partners(tier=tier, region=region):
        typer.echo(f"{p['id']}\t{p['name']}")


@app.command("partner:show")
def partner_show(pid: str = typer.Option(..., "--id")):
    p = partner_catalog.show_partner(pid)
    typer.echo(json.dumps(p, indent=2))


# sku commands
@app.command("sku:list")
def sku_list():
    for sku in sku_packs.load_skus().keys():
        typer.echo(sku)


@app.command("sku:show")
def sku_show(sku: str = typer.Option(..., "--sku")):
    pack = sku_packs.load_skus().get(sku)
    typer.echo(json.dumps(pack.__dict__, indent=2))


# license key commands
@app.command("license:gen")
def license_gen(
    tenant: str = typer.Option(..., "--tenant"),
    sku: str = typer.Option(..., "--sku"),
    seats: int = typer.Option(..., "--seats"),
    start: str = typer.Option(..., "--start"),
    end: str = typer.Option(..., "--end"),
):
    key = license_keys.generate_key(tenant, sku, seats, start, end)
    typer.echo(key)


@app.command("license:verify")
def license_verify(key: str = typer.Option(..., "--key")):
    payload = license_keys.verify_key(key)
    typer.echo(json.dumps(payload, indent=2))


# entitlement commands
@app.command("entitlement:add")
def entitlement_add(
    tenant: str = typer.Option(None, "--tenant"),
    sku: str = typer.Option(None, "--sku"),
    seats: int = typer.Option(0, "--seats"),
    start: str = typer.Option("", "--start"),
    end: str = typer.Option("", "--end"),
    from_key: str = typer.Option(None, "--from-key"),
):
    if from_key:
        entitlement_engine.add_from_key(from_key)
    else:
        entitlement_engine.add_entitlement(tenant, sku, seats, start, end)


@app.command("entitlement:resolve")
def entitlement_resolve(tenant: str = typer.Option(..., "--tenant")):
    res = entitlement_engine.resolve(tenant)
    typer.echo(json.dumps(res, indent=2))


# billing commands
@app.command("bill:run")
def bill_run(period: str = typer.Option(..., "--period")):
    billing_invoices.run(period)


@app.command("bill:show")
def bill_show(invoice: str = typer.Option(..., "--invoice")):
    inv = billing_invoices.show(invoice)
    typer.echo(json.dumps(inv, indent=2))


# certification
@app.command("cert:take")
def cert_take(
    partner: str = typer.Option(..., "--partner"),
    exam: str = typer.Option(..., "--exam"),
    answers: Path = typer.Option(..., "--answers", exists=True, file_okay=True, dir_okay=False),
):
    attempt = partner_certify.grade(partner, exam, answers)
    typer.echo(attempt.status)


@app.command("cert:status")
def cert_status(partner: str = typer.Option(..., "--partner")):
    typer.echo(json.dumps(partner_certify.status(partner), indent=2))


# marketplace orders
@app.command("market:order")
def market_order(
    tenant: str = typer.Option(..., "--tenant"),
    listing: str = typer.Option(..., "--listing"),
    qty: int = typer.Option(1, "--qty"),
):
    order = partner_orders.place_order(tenant, listing, qty)
    typer.echo(order.id)


@app.command("market:provision")
def market_provision(order: str = typer.Option(..., "--order")):
    order_obj = partner_orders.provision(order)
    typer.echo(order_obj.status)
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

def mfg_mrp_cmd(demand: Path = typer.Option(..., "--demand", exists=True), inventory: Path = typer.Option(..., "--inventory", exists=True), pos: Path = typer.Option(..., "--pos", exists=True)):
    plan = mfg_mrp.plan(str(demand), str(inventory), str(pos))
    typer.echo(json.dumps(plan))

@app.command("exp:new")
def exp_new(
    id: str = typer.Option(..., "--id"),
    name: str = typer.Option(..., "--name"),
    feature: str = typer.Option(..., "--feature"),
    variants: str = typer.Option(..., "--variants"),
    split: str = typer.Option(..., "--split"),
    unit: str = typer.Option(..., "--unit"),
):
    exp = exp_registry.Experiment(
        id=id,
        name=name,
        feature=feature,
        start="", end="",
        unit=unit,
        variants=variants.split(","),
        split=[float(x) for x in split.split(",")],
    )
    exp_registry.register_experiment(exp)
    typer.echo("ok")


@app.command("exp:assign")
def exp_assign(
    id: str = typer.Option(..., "--id"),
    unit: str = typer.Option(..., "--unit"),
    value: str = typer.Option(..., "--value"),
):
    reg = exp_registry.load_registry()
    exp = reg[id]
    v = exp_registry.assign_variant(exp, value)
    typer.echo(v)


@app.command("exp:analyze")
def exp_analyze(
    id: str = typer.Option(..., "--id"),
    metrics: Path = typer.Option(..., "--metrics"),
):
    reg = exp_registry.load_registry()
    exp = reg[id]
    res = ab_engine.analyze(exp, str(metrics))
    typer.echo(res["decision"])


@app.command("flag:impact")
def flag_impact(
    feature: str = typer.Option(..., "--feature"),
    window: int = typer.Option(14, "--window"),
):
    res = flag_analytics.impact(feature, window)
    typer.echo(json.dumps(res))


@app.command("rollout:plan")
def rollout_plan(
    feature: str = typer.Option(..., "--feature"),
    stages: str = typer.Option(..., "--stages"),
):
    plan = rollout.plan(feature, [int(s) for s in stages.split(",")])
    typer.echo(json.dumps(plan))


@app.command("rollout:gate")
def rollout_gate(
    feature: str = typer.Option(..., "--feature"),
    stage: int = typer.Option(..., "--stage"),
):
    typer.echo(rollout.gate(feature, stage))


@app.command("growth:simulate")
def growth_simulate(
    horizon: int = typer.Option(..., "--horizon"),
    config: Path = typer.Option(..., "--config"),
):
    res = growth_loops.simulate(horizon, str(config))
    typer.echo(json.dumps(res["WAU"][-1]))


@app.command("funnel:build")
def funnel_build(
    steps: str = typer.Option(..., "--steps"),
    start: str = typer.Option(..., "--from"),
    end: str = typer.Option(..., "--to"),
):
    res = growth_funnels.build(steps.split(","), start, end)
    typer.echo(json.dumps(res))


@app.command("exp:review")
def exp_review(id: str = typer.Option(..., "--id")):
    res = review_pack.build(id)
    typer.echo(json.dumps(res))


@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")
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

from close import calendar as close_calendar
from close import journal as close_journal
from close import recon as close_recon
from close import flux as close_flux
from close import sox as close_sox
from close import packet as close_packet


@app.command("close:cal:new")
def close_cal_new(period: str = typer.Option(..., "--period"), template: Path = typer.Option(..., "--template", exists=True)):
    cal = close_calendar.CloseCalendar.from_template(period, str(template))
    cal.save()
    typer.echo("ok")


@app.command("close:cal:list")
def close_cal_list(period: str = typer.Option(..., "--period")):
    cal = close_calendar.load_calendar(period)
    for t in cal.tasks:
        typer.echo(json.dumps(asdict(t)))


@app.command("close:cal:update")
def close_cal_update(
    period: str = typer.Option(..., "--period"),
    task: str = typer.Option(..., "--task"),
    status: str = typer.Option(None, "--status"),
    evidence: str = typer.Option(None, "--evidence"),
):
    cal = close_calendar.load_calendar(period)
    cal.update(task, status, evidence)
    typer.echo("updated")


@app.command("close:jrnl:propose")
def close_jrnl_propose(
    period: str = typer.Option(..., "--period"),
    rules: Path = typer.Option(..., "--rules", exists=True),
):
    close_journal.propose_journals(period, str(rules))
    typer.echo("proposed")


@app.command("close:jrnl:post")
def close_jrnl_post(period: str = typer.Option(..., "--period")):
    journals = close_journal.load_journals(period)
    close_journal.post(period, journals)
    typer.echo("posted")


@app.command("close:recon:run")
def close_recon_run(period: str = typer.Option(..., "--period"), fixtures: Path = typer.Option(..., "--fixtures", exists=True)):
    close_recon.run_recons(period, str(fixtures))
    typer.echo("recons")


@app.command("close:flux")
def close_flux_cmd(
    period: str = typer.Option(..., "--period"),
    prev: str = typer.Option(..., "--prev"),
    py: str = typer.Option(..., "--py"),
    threshold: float = typer.Option(..., "--threshold"),
):
    close_flux.run_flux(period, prev, py, threshold)
    typer.echo("flux")


@app.command("close:sox:add")
def close_sox_add(
    period: str = typer.Option(..., "--period"),
    control: str = typer.Option(..., "--control"),
    path: str = typer.Option(..., "--path"),
    owner: str = typer.Option("cli", "--owner"),
):
    close_sox.add_evidence(period, control, path, owner)
    typer.echo("logged")


@app.command("close:sox:check")
def close_sox_check(period: str = typer.Option(..., "--period")):
    close_sox.check_evidence(period)
    typer.echo("ok")


@app.command("close:packet")
def close_packet_cmd(period: str = typer.Option(..., "--period")):
    close_packet.build_packet(period)
    typer.echo("packet")


@app.command("close:sign")
def close_sign(period: str = typer.Option(..., "--period"), role: str = typer.Option(..., "--role"), as_user: str = typer.Option(..., "--as-user")):
    close_packet.sign(period, role, as_user)
    typer.echo("signed")

@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")

if __name__ == "__main__":
    app()
