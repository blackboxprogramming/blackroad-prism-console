import fs from 'fs';
import yaml from 'yaml';

function ymd(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }

const okr = yaml.parse(fs.readFileSync('okr/okr.yaml','utf-8'));
const kpi = JSON.parse(fs.readFileSync('data/kpi/kpi_latest.json','utf-8') || '{}');
const fc  = JSON.parse(fs.readFileSync('data/finance/forecast.json','utf-8') || '{}');

const lines: string[] = [];
lines.push(`# Board Pack — ${ymd()}`);
lines.push(`\n## OKRs\n`);
for (const o of okr.company_objectives) {
  lines.push(`- **${o.key}** ${o.title} _(owner: ${o.owner})_`);
  for (const kr of o.key_results) lines.push(`  - ${kr.kr}: ${kr.metric} → target ${kr.target}, current ${kpi[kr.metric] ?? 'n/a'}`);
}
lines.push(`\n## KPIs (snapshot)\n`);
for (const [name,val] of Object.entries(kpi)) lines.push(`- ${name}: ${val}`);

lines.push(`\n## Forecast (ARR)\n- start: ${fc.start_month}\n- months: ${fc.months}\n- base last: ${fc.base?.[fc.base.length-1]?.arr}\n- bull last: ${fc.bull?.[fc.bull.length-1]?.arr}\n- bear last: ${fc.bear?.[fc.bear.length-1]?.arr}`);

fs.mkdirSync('board', { recursive: true });
const out = `board/BOARD_${ymd()}.md`;
fs.writeFileSync(out, lines.join('\n'));
console.log('Wrote', out);
