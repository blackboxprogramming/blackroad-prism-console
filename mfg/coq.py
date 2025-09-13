import csv, os, argparse, json
ART_DIR = os.path.join('artifacts','mfg','coq')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    rows = [
        {'bucket':'Prevention','amount':1200.0},
        {'bucket':'Appraisal','amount':800.0},
        {'bucket':'Internal Failure','amount':450.0},
        {'bucket':'External Failure','amount':150.0}
    ]
    with open(os.path.join(ART_DIR,'coq.csv'),'w') as f:
        f.write('bucket,amount\n')
        for r in rows: f.write(f"{r['bucket']},{r['amount']}\n")
    with open(os.path.join(ART_DIR,'coq.md'),'w') as f:
        total = sum(r['amount'] for r in rows)
        f.write(f"# COQ {period}\n\nTotal={total:.2f}\n")
    print("coq_built=1")

# CLI

def cli_coq(argv):
    p = argparse.ArgumentParser(prog='mfg:coq')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
