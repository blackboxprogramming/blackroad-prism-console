import fs from 'fs';
const MON='data/aiops/monitor.jsonl';
const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Monitor Report ${ym}\n\n`;
if (fs.existsSync(MON)){
  const rows=fs.readFileSync(MON,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const last=rows.slice(-1)[0]||{};
  md += `- Last env: ${last.env||'n/a'}\n- Last p95: ${last.metrics?.latency_p95||'n/a'}\n- Last err: ${last.metrics?.error_rate||'n/a'}\n`;
}
fs.mkdirSync('aiops/reports',{recursive:true}); fs.writeFileSync(`aiops/reports/MONITOR_${ym}.md`, md);
console.log('monitor report written');
