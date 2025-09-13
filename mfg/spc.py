import csv, os, json, argparse, math

ART_DIR = os.path.join('artifacts','mfg','spc')
os.makedirs(ART_DIR, exist_ok=True)

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
    # Rules
    for i,x in enumerate(xs):
        if s>0 and (x>ucl or x<lcl): findings.append({'i':i,'rule':RULE_POINT_BEYOND_3SIG})
    # Trend 7 (strictly increasing or decreasing)
    if len(xs)>=7:
        inc = all(xs[i]<xs[i+1] for i in range(len(xs)-1))
        dec = all(xs[i]>xs[i+1] for i in range(len(xs)-1))
        if inc or dec: findings.append({'i':len(xs)-1,'rule':RULE_TREND_7})
    # Run 8 on one side
    if s>0 and len(xs)>=8:
        above = [x>m for x in xs]
        run = 1; ok=False
        for i in range(1,len(above)):
            run = run+1 if above[i]==above[i-1] else 1
            if run>=8: ok=True; break
        if ok: findings.append({'i':i,'rule':RULE_RUN_8_ONE_SIDE})
    # Outputs
    os.makedirs(ART_DIR, exist_ok=True)
    fjson = os.path.join(ART_DIR, 'findings.json')
    with open(fjson,'w') as f: json.dump({'op':op,'m':m,'s':s,'ucl':ucl,'lcl':lcl,'findings':findings}, f, indent=2, sort_keys=True)
    fmd = os.path.join(ART_DIR, 'charts.md')
    with open(fmd,'w') as f:
        f.write(f"# SPC {op}\n\nmean={m:.4f} s={s:.4f} UCL={ucl:.4f} LCL={lcl:.4f}\n\n")
        for x in xs:
            f.write('|'+'#'*max(1,int(10*(x-m)/(s+1e-9)+10))+'\n')
    print(f"spc_findings={len(findings)} -> {fjson}")
    # After computing findings, set a blocking flag if any 3-sigma breach exists
    critical = any(f['rule']==RULE_POINT_BEYOND_3SIG for f in findings)
    flag_path = os.path.join(ART_DIR, 'blocking.flag')
    if critical:
        with open(flag_path, 'w') as _f: _f.write('SPC_BLOCK')
    else:
        if os.path.exists(flag_path):
            os.remove(flag_path)

# === CLI ===

def cli_spc_analyze(argv):
    p = argparse.ArgumentParser(prog='mfg:spc:analyze')
    p.add_argument('--op', required=True)
    p.add_argument('--window', type=int, default=50)
    a = p.parse_args(argv)
    analyze(a.op, a.window)
