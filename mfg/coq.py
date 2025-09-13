import os, argparse
ART_DIR = os.path.join('artifacts','mfg','coq')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    rows = [
        ('Prevention',1200.0),('Appraisal',800.0),('Internal Failure',450.0),('External Failure',150.0)
    ]
    with open(os.path.join(ART_DIR,'coq.csv'),'w') as f:
        f.write('bucket,amount\n')
        for b,a in rows: f.write(f"{b},{a}\n")
    with open(os.path.join(ART_DIR,'coq.md'),'w') as f:
        total = sum(a for _,a in rows)
        f.write(f"# COQ {period}\n\nTotal={total:.2f}\n")
    print("coq_built=1")

# CLI

def cli_coq(argv):
    p = argparse.ArgumentParser(prog='mfg:coq')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
