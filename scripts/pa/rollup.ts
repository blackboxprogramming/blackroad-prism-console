import fs from 'fs';
const E='data/pa/events.jsonl'; const ymd=new Date().toISOString().slice(0,10).replace(/-/g,'');
let active=0;
if (fs.existsSync(E)){ const rows=fs.readFileSync(E,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); const today=rows.filter((r:any)=> new Date(r.ts).toISOString().slice(0,10)===new Date().toISOString().slice(0,10)); active=new Set(today.map((t:any)=>t.subjectId)).size; }
const md=`# Product Metrics ${ymd}\n\n- Active users (daily): ${active}\n`;
fs.mkdirSync('pa/reports',{recursive:true}); fs.writeFileSync(`pa/reports/METRICS_${ymd}.md`, md);
console.log('rollup written');
