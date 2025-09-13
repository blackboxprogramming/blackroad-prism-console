import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
import yaml

from bench import runner as bench_runner
from bots import available_bots
from dashboards import sc_ops_fin
from finance import wc as finance_wc
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from procure import optimizer as procure_opt
from sop import plan as sop_plan
from supply import inventory_sim, logistics
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


if __name__ == "__main__":
    app()
