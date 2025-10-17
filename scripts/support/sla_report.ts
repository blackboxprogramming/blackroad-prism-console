import fs from 'fs';
const F='data/support/sla_events.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let count=0; if (fs.existsSync(F)){ count = fs.readFileSync(F,'utf-8').trim().split('\n').filter(Boolean).length; }
const md=`# SLA ${ym}\n\n- Evaluations: ${count}\n`;
fs.mkdirSync('support/reports',{recursive:true}); fs.writeFileSync(`support/reports/SLA_${ym}.md`, md);
console.log('sla report written');
