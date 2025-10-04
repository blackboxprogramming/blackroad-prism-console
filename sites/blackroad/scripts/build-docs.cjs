#!/usr/bin/env node
/**
 * Build-time docs loader:
 * - Reads Markdown from sites/blackroad/content/docs
 * - Writes public/docs/<slug>.json & index.json
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const SRC = path.join(process.cwd(), 'sites', 'blackroad', 'content', 'docs');
const OUT = path.join(process.cwd(), 'sites', 'blackroad', 'public', 'docs');
const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'doc';
function walk(d) {
  if (!fs.existsSync(d)) return [];
  const out = [];
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.md$/i.test(f)) out.push(p);
  }
  return out;
}
function main() {
  ensure(OUT);
  const posts = [];
  for (const fp of walk(SRC)) {
    const raw = fs.readFileSync(fp, 'utf8');
    const { data, content } = matter(raw);
    const title = data.title || path.basename(fp).replace(/\.md$/, '');
    const s = slug(data.slug || title);
    let html = marked.parse(content);
    const metricsSelector = data.metrics_selector || {};
    const ruleId = data.rule_id || data.id || '';
    const chartSource = metricsSelector.prom || metricsSelector.ch;
    if (ruleId && chartSource) {
      const chartId = `chart-${s}`;
      const endpoint = `/metrics/${ruleId}`;
      const script = `\n<h2>Live trend (last 7 days)</h2>\n<div id="${chartId}" style="height:240px;"></div>\n<script>\n(async function(){\n  const endpoint = ${JSON.stringify(endpoint)};\n  if(!endpoint) return;\n  const res = await fetch(endpoint);\n  if(!res.ok) return;\n  const payload = await res.json();\n  const el = document.getElementById(${JSON.stringify(chartId)});\n  if(!el) return;\n  const w = el.clientWidth || 640;\n  const h = 240;\n  const points = Array.isArray(payload.points) ? payload.points : [];\n  if(!points.length){ el.textContent = "(no data)"; return; }\n  const x0 = Math.min(...points.map(p=>p.t));\n  const x1 = Math.max(...points.map(p=>p.t));\n  const span = x1 - x0 || 1;\n  const toX = x => ((x - x0) / span) * (w - 2) + 1;\n  const toY = y => h - y * (h - 2) - 1;\n  let d = "M" + toX(points[0].t) + "," + toY(points[0].v);\n  for(let i=1;i<points.length;i++){ d += " L" + toX(points[i].t) + "," + toY(points[i].v); }\n  el.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><rect width="' + w + '" height="' + h + '" fill="white" stroke="#ddd"/><path d="' + d + '" fill="none" stroke="#1f77b4" stroke-width="2"/><text x="8" y="18" font-size="12" fill="#333">' + ${JSON.stringify(title)} + '</text><text x="' + (w - 60) + '" y="18" font-size="12" fill="#333">ratio</text></svg>';\n})();\n</script>\n`;
      html += script;
    }
    const item = { slug: s, title, section: data.section || 'General' };
    posts.push(item);
    fs.writeFileSync(path.join(OUT, `${s}.json`), JSON.stringify({ ...item, html }, null, 2));
  }
  posts.sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ docs: posts }, null, 2));
}
main();
