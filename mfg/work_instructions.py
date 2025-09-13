import os, argparse
from datetime import datetime

ART_DIR = os.path.join('artifacts','mfg','wi')
os.makedirs(ART_DIR, exist_ok=True)

HTML_HEAD = """<meta charset='utf-8'><style>body{font-family:ui-monospace,monospace;max-width:720px;margin:2rem auto;line-height:1.5}</style>"""


def render(item: str, rev: str, routing: dict | None = None):
    # DUTY_REV_MISMATCH simple check (expect routing file with same rev)
    routing_dir = os.path.join('fixtures','mfg','routings')
    expected_yaml = os.path.join(routing_dir, f"{item}_{rev}.yaml")
    if not os.path.exists(expected_yaml):
        raise SystemExit("DUTY_REV_MISMATCH: routing & BOM revs mismatch or missing routing fixture")

    fname_md = os.path.join(ART_DIR, f"{item}_{rev}.md")
    fname_html = os.path.join(ART_DIR, f"{item}_{rev}.html")
    md = f"""# Work Instructions — {item} rev {rev}\n\n- Revision: {rev}\n- Generated: {datetime.utcnow().isoformat()}Z\n\n## Safety\n- ESD protection required.\n\n## Steps\n1. Kitting per MRP.\n2. Assemble per routing.\n3. Torque per table.\n"""
    with open(fname_md,'w') as f: f.write(md)
    with open(fname_html,'w') as f: f.write(HTML_HEAD+md.replace('\n','<br/>'))
    print(f"wi_rendered=1 -> {fname_md}")

# CLI

def cli_wi_render(argv):
    p = argparse.ArgumentParser(prog='mfg:wi:render')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    a = p.parse_args(argv)
    render(a.item, a.rev, None)
