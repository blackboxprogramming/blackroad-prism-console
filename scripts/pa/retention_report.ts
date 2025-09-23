import fs from 'fs';
const R='data/pa/retention.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Retention ${ym}\n\n`;
if (fs.existsSync(R)){ const rows=fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); rows.slice(-10).forEach((r:any)=>{ md+=`- ${r.period} ${r.anchor_event}→${r.return_event} rate=${r.rate}\n`; }); }
fs.mkdirSync('pa/reports',{recursive:true}); fs.writeFileSync(`pa/reports/RETENTION_${ym}.md`, md);
console.log('retention report written');
