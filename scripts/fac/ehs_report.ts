import fs from 'fs';
const IN='data/fac/ehs_incidents.jsonl', IS='data/fac/inspections.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const inc=fs.existsSync(IN)? fs.readFileSync(IN,'utf-8').trim().split('\n').filter(Boolean).length:0;
const insp=fs.existsSync(IS)? fs.readFileSync(IS,'utf-8').trim().split('\n').filter(Boolean).length:0;
const md=`# EHS ${ym}\n\n- Incidents: ${inc}\n- Inspections: ${insp}\n`;
fs.mkdirSync('fac/reports',{recursive:true}); fs.writeFileSync(`fac/reports/EHS_${ym}.md`, md);
console.log('ehs report written');
