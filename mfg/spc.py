import csv, os, json, argparse, math

ART_DIR = os.path.join('artifacts','mfg','spc')
os.makedirs(ART_DIR, exist_ok=True)

from orchestrator import metrics
from tools import artifacts
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "spc"
FIXTURES = ROOT / "fixtures" / "mfg" / "spc"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_spc.schema.json"
RULE_POINT_BEYOND_3SIG = 'SPC_POINT_BEYOND_3SIG'
RULE_TREND_7 = 'SPC_TREND_7'
RULE_RUN_8_ONE_SIDE = 'SPC_RUN_8_ONE_SIDE'


def _mean(xs): return sum(xs)/len(xs) if xs else 0.0

def _stdev(xs):
    if len(xs)<2: return 0.0
    m = _mean(xs)
    var = sum((x-m)**2 for x in xs)/(len(xs)-1)
    return math.sqrt(var)


def analyze(op: str, window: int, csv_dir='fixtures/mfg/spc'):
    path = os.path.join(csv_dir, f"{op}_sample.csv")
    xs = []
    with open(path, newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            xs.append(float(row['measure']))
    xs = xs[-window:]
    m = _mean(xs); s = _stdev(xs)
    ucl = m + 3*s; lcl = m - 3*s
    findings = []
    # rule: point beyond 3 sigma
    for v in vals:
        if abs(v - mean) > 3 * sigma:
            findings.append("SPC_POINT_BEYOND_3SIG")
            break
    # trend 7
    trend = 1
    for i in range(1, len(vals)):
        if vals[i] > vals[i - 1]:
            trend = trend + 1 if trend > 0 else 1
        elif vals[i] < vals[i - 1]:
            trend = trend - 1 if trend < 0 else -1
        else:
            trend = 0
        if abs(trend) >= 7:
            findings.append("SPC_TREND_7")
            break
    # run 8 one side
    run = 0
    for v in vals:
        if v > mean:
            run = run + 1 if run >= 0 else 1
        elif v < mean:
            run = run - 1 if run <= 0 else -1
        else:
            run = 0
        if abs(run) >= 8:
            findings.append("SPC_RUN_8_ONE_SIDE")
            break
    ART_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "op": op,
        "sample_size": len(vals),
        "mean": mean,
        "sigma": sigma,
        "findings": findings,
        "series": [{"index": i, "value": v} for i, v in enumerate(vals, 1)],
        "unstable": bool(findings),
    }
    artifacts.validate_and_write(str(ART_DIR / "report.json"), report, str(SCHEMA))
    chart_lines = ["index,value"] + [f"{pt['index']},{pt['value']}" for pt in report["series"]]
    artifacts.validate_and_write(str(ART_DIR / "charts.md"), "\n".join(chart_lines))
    if report["unstable"]:
        artifacts.validate_and_write(str(ART_DIR / "blocking.flag"), "1")
    else:
        flag = ART_DIR / "blocking.flag"
        if flag.exists():
            flag.unlink()
        sig = ART_DIR / "blocking.flag.sig"
        if sig.exists():
            sig.unlink()
    metrics.inc("spc_findings", len(findings) or 1)
    return report
    storage.write(str(ART_DIR / "findings.json"), json.dumps(findings, indent=2))
    chart_lines = ["index,value"] + [f"{i},{v}" for i, v in enumerate(vals, 1)]
    storage.write(str(ART_DIR / "charts.md"), "\n".join(chart_lines))
    return findings
    for i,x in enumerate(xs):
        if s>0 and (x>ucl or x<lcl): findings.append({'i':i,'rule':RULE_POINT_BEYOND_3SIG})
    if len(xs)>=7:
        inc = all(xs[i]<xs[i+1] for i in range(len(xs)-1))
        dec = all(xs[i]>xs[i+1] for i in range(len(xs)-1))
        if inc or dec: findings.append({'i':len(xs)-1,'rule':RULE_TREND_7})
    if s>0 and len(xs)>=8:
        above = [x>m for x in xs]
        run = 1; ok=False
        for i in range(1,len(above)):
            run = run+1 if above[i]==above[i-1] else 1
            if run>=8: ok=True; break
        if ok: findings.append({'i':i,'rule':RULE_RUN_8_ONE_SIDE})
    fjson = os.path.join(ART_DIR, 'findings.json')
    with open(fjson,'w') as f: json.dump({'op':op,'m':m,'s':s,'ucl':ucl,'lcl':lcl,'findings':findings}, f, indent=2, sort_keys=True)
    fmd = os.path.join(ART_DIR, 'charts.md')
    with open(fmd,'w') as f:
        f.write(f"# SPC {op}\n\nmean={m:.4f} s={s:.4f} UCL={ucl:.4f} LCL={lcl:.4f}\n\n")
        for x in xs:
            f.write('|'+'#'*max(1,int(10*(x-m)/(s+1e-9)+10))+'\n')
    # blocking flag on any 3σ breach
    flag_path = os.path.join(ART_DIR, 'blocking.flag')
    if any(f['rule']==RULE_POINT_BEYOND_3SIG for f in findings):
        with open(flag_path,'w') as _f: _f.write('SPC_BLOCK')
    else:
        if os.path.exists(flag_path): os.remove(flag_path)
    print(f"spc_findings={len(findings)} -> {fjson}")

# CLI

def cli_spc_analyze(argv):
    p = argparse.ArgumentParser(prog='mfg:spc:analyze')
    p.add_argument('--op', required=True)
    p.add_argument('--window', type=int, default=50)
    a = p.parse_args(argv)
    analyze(a.op, a.window)
