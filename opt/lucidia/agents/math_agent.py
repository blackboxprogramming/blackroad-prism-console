import re, requests, base64
from typing import Dict, Any

SYM_ENDPOINT = "http://127.0.0.1:18081/compute"

MATH_HINT = re.compile(r"""
    (integral|differentiate|derivative|series|solve|root|factor|expand|simplify|plot)
    |[+\-*/^=]
""", re.I | re.X)

def can_handle(message: str) -> bool:
    return bool(MATH_HINT.search(message))

def build_payload(message: str) -> Dict[str, Any]:
    txt = message.strip()
    do = ["simplify","diff","integrate","series","solve","numeric"]
    target_eq_zero = False
    if txt.lower().startswith("solve "):
        txt = re.sub(r"^solve\s+", "", txt, flags=re.I)
        target_eq_zero = True
        do = ["simplify","solve"]
    plot = "plot" in txt.lower() or "graph" in txt.lower()
    return {
        "expr": re.sub(r"^compute:\s*", "", txt, flags=re.I),
        "vars": ["x"],
        "do": do,
        "series_order": 6,
        "plot": plot,
        "target_eq_zero": target_eq_zero
    }

def handle(message: str) -> Dict[str, Any]:
    pld = build_payload(message)
    r = requests.post(SYM_ENDPOINT, json=pld, timeout=20)
    r.raise_for_status()
    data = r.json()
    resp_lines = []
    resp_lines.append(f"**Input**: $$ {data.get('expr_latex','')} $$")
    if "simplify_latex" in data:
        resp_lines.append(f"**Simplified**: $$ {data['simplify_latex']} $$")
    if "derivative_latex" in data:
        resp_lines.append(f"**Derivative**: $$ {data['derivative_latex']} $$")
    if "integral_latex" in data:
        resp_lines.append(f"**Integral**: $$ {data['integral_latex']} $$")
    if "series_latex" in data:
        resp_lines.append(f"**Series**: $$ {data['series_latex']} $$")
    if data.get("roots_latex"):
        roots = ", ".join([f"$$ {r} $$" for r in data["roots_latex"]])
        resp_lines.append(f"**Solutions**: {roots}")
    if isinstance(data.get("numeric"), (int, float)):
        resp_lines.append(f"**Numeric**: {data['numeric']}")
    if "plot_png_b64" in data:
        resp_lines.append(f"[plot:image] data:image/png;base64,{data['plot_png_b64']}")
    return {
        "channel": "math",
        "markdown": "\n\n".join(resp_lines),
        "attachments": [{
            "type": "image",
            "src": f"data:image/png;base64,{data['plot_png_b64']}"
        }] if "plot_png_b64" in data else []
    }
