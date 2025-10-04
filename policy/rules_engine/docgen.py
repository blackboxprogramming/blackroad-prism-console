from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Any, Mapping

import yaml


def _slugify(value: str) -> str:
    value = value.strip().lower()
    if not value:
        return "rule"
    slug_chars: list[str] = []
    for ch in value:
        if ch.isalnum():
            slug_chars.append(ch)
        elif ch in {" ", "-", "_"}:
            if not slug_chars or slug_chars[-1] != "-":
                slug_chars.append("-")
    slug = "".join(slug_chars).strip("-")
    return slug or "rule"


def _render_chart(config: Mapping[str, Any], title: str) -> str:
    endpoint = config.get("endpoint")
    if not endpoint:
        return ""
    endpoint_js = json.dumps(str(endpoint))
    title_js = json.dumps(config.get("title") or title)
    return f"""
<h2>Live trend</h2>
<div id=\"rule-chart\" style=\"height:240px;max-width:720px;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;\"></div>
<script>
(function(){{
  const endpoint = {endpoint_js};
  const title = {title_js};
  const el = document.getElementById('rule-chart');
  if (!el || !endpoint) return;
  fetch(endpoint).then(res => res.json()).then(data => {{
    const points = Array.isArray(data.points) ? data.points : [];
    const w = el.clientWidth || 640;
    const h = 240;
    if (points.length === 0) {{
      el.innerHTML = '<div style="padding:16px;color:#666;font-size:14px;">No data available for the selected window.</div>';
      return;
    }}
    const xs = points.map(p => p.t);
    const ys = points.map(p => p.v);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const toX = x => ((x - x0) / ((x1 - x0) || 1)) * (w - 2) + 1;
    const toY = y => h - ((y - 0) / (1 || 1)) * (h - 2) - 1;
    let d = 'M' + toX(xs[0]) + ',' + toY(ys[0]);
    for (let i = 1; i < xs.length; i++) {{
      d += ' L' + toX(xs[i]) + ',' + toY(ys[i]);
    }}
    const rightLabelX = Math.max(w - 48, 8);
    el.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><rect width="' + w + '" height="' + h + '" fill="white" stroke="#ddd"/><path d="' + d + '" fill="none" stroke="#1f77b4" stroke-width="2"/><text x="8" y="18" font-size="12" fill="#333">' + title + '</text><text x="' + rightLabelX + '" y="18" font-size="12" fill="#333">ratio</text></svg>';
  }}).catch(() => {{
    el.innerHTML = '<div style="padding:16px;color:#b94a48;font-size:14px;">Unable to load live metrics.</div>';
  }});
}})();
</script>
"""


def render_rule_document(rule: Mapping[str, Any]) -> str:
    rule_id = str(rule.get("rule_id") or rule.get("id") or "")
    name = str(rule.get("name") or rule_id or "Unnamed Rule")
    description = (rule.get("description") or "").strip()
    category = str(rule.get("category") or rule.get("mode") or "observe")
    severity = str(rule.get("severity") or "").lower()
    owners = [str(o) for o in rule.get("owners", [])]
    channels = [str(c) for c in rule.get("notify", {}).get("channels", [])]
    on_match = rule.get("on_match") or {}
    expr = str(rule.get("expr") or "")
    metrics_selector = rule.get("metrics_selector") or {}

    chart_html = _render_chart(rule.get("docs_chart") or {}, name)

    owners_html = ", ".join(html.escape(owner) for owner in owners) or "—"
    channels_html = ", ".join(html.escape(ch) for ch in channels) or "—"
    severity_label = severity.capitalize() if severity else "—"

    prom_selector = html.escape(metrics_selector.get("prom", "").strip())
    ch_selector = html.escape(metrics_selector.get("ch", "").strip())

    on_match_reason = html.escape(str(on_match.get("reason") or "—"))
    on_match_decision = html.escape(str(on_match.get("decision") or "notify"))

    description_html = f"<p>{html.escape(description)}</p>" if description else ""

    prom_block = f"<pre><code>{prom_selector}</code></pre>" if prom_selector else "<p>No Prometheus selector configured.</p>"
    ch_block = f"<pre><code>{ch_selector}</code></pre>" if ch_selector else "<p>No ClickHouse selector configured.</p>"

    expr_block = html.escape(expr)

    return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <title>{html.escape(name)}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 32px; color: #1f2933; }}
    h1 {{ margin-bottom: 0.25em; }}
    h2 {{ margin-top: 2.5em; }}
    pre {{ background: #f5f7fa; padding: 12px 16px; border-radius: 6px; overflow-x: auto; }}
    code {{ font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; font-size: 0.95em; }}
    table {{ border-collapse: collapse; margin-top: 1em; }}
    th, td {{ padding: 6px 12px; border-bottom: 1px solid #e5e9f0; text-align: left; }}
    ul {{ padding-left: 20px; }}
  </style>
</head>
<body>
  <h1>{html.escape(name)}</h1>
  {description_html}
  <table>
    <tr><th>Rule ID</th><td>{html.escape(rule_id)}</td></tr>
    <tr><th>Category</th><td>{html.escape(category)}</td></tr>
    <tr><th>Severity</th><td>{html.escape(severity_label)}</td></tr>
    <tr><th>Owners</th><td>{owners_html}</td></tr>
    <tr><th>Notify</th><td>{channels_html}</td></tr>
    <tr><th>On match</th><td>Decision: {on_match_decision}<br/>Reason: {on_match_reason}</td></tr>
  </table>

  <h2>Expression</h2>
  <pre><code>{expr_block}</code></pre>

  <h2>Metrics selectors</h2>
  <h3>Prometheus</h3>
  {prom_block}
  <h3>ClickHouse</h3>
  {ch_block}

  {chart_html}
</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Render rule documentation HTML from YAML definitions.")
    parser.add_argument("rule", help="Path to the rule YAML file")
    parser.add_argument("output", help="Directory to write the HTML file into")
    args = parser.parse_args()

    rule_path = Path(args.rule)
    if not rule_path.exists():
        raise SystemExit(f"rule file not found: {rule_path}")

    payload = yaml.safe_load(rule_path.read_text())
    document = render_rule_document(payload)

    name = str(payload.get("name") or payload.get("rule_id") or rule_path.stem)
    slug = _slugify(name)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slug}.html"
    output_path.write_text(document, encoding="utf-8")
    print(output_path)


if __name__ == "__main__":
    main()
