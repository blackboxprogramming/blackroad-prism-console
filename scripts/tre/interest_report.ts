import fs from 'fs';
const I='data/treasury/debt_interest.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Debt Interest ${ym}\n\n`;
if (fs.existsSync(I)){ const rows=fs.readFileSync(I,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((r:any)=>r.period===ym); rows.forEach(r=>{ md+=`- Interest: ${r.interest}\n`; }); }
fs.mkdirSync('treasury/reports',{recursive:true}); fs.writeFileSync(`treasury/reports/INTEREST_${ym}.md`, md);
console.log('interest report written');
