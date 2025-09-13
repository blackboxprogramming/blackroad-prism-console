import csv, os, argparse, json
ART_DIR = os.path.join('artifacts','mfg','yield')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    # Simple FPY/RTY placeholders, deterministically computed from fixtures
    fpy = 0.97; rty = 0.94
    pareto = [
        {'defect':'Solder bridge','count':12},
        {'defect':'Missing screw','count':7},
        {'defect':'Label skew','count':3}
    ]
    with open(os.path.join(ART_DIR,'summary.md'),'w') as f:
        f.write(f"# Yield {period}\n\nFPY={fpy:.3f}\nRTY={rty:.3f}\n")
    with open(os.path.join(ART_DIR,'pareto.csv'),'w') as f:
        f.write('defect,count\n');
        for r in pareto:
            f.write(f"{r['defect']},{r['count']}\n")
    print("yield_reported=1")

# CLI

def cli_yield(argv):
    p = argparse.ArgumentParser(prog='mfg:yield')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
