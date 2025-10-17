import fs from 'fs';
const F='data/pa/funnels.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Funnels ${ym}\n\n`;
if (fs.existsSync(F)){ const rows=fs.readFileSync(F,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); rows.slice(-10).forEach((r:any)=>{ md+=`- ${r.funnelId} ${r.period}: ${JSON.stringify(r.counts)}\n`; }); }
fs.mkdirSync('pa/reports',{recursive:true}); fs.writeFileSync(`pa/reports/FUNNEL_${ym}.md`, md);
console.log('funnel report written');
