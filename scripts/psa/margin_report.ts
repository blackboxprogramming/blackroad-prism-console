import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const BILL='data/psa/billing.jsonl', EXP='data/psa/expenses.jsonl';
const bill=fs.existsSync(BILL)?fs.readFileSync(BILL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const exp =fs.existsSync(EXP)? fs.readFileSync(EXP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const rev=bill.reduce((s,b)=>s+Number(b.amount||0),0);
const cost=exp.reduce((s,e)=>s+Number(e.amount||0),0);
const margin=Number((rev-cost).toFixed(2));
const md=`# Margin ${yyyymm()}\n\n- Revenue: ${rev}\n- Cost: ${cost}\n- Margin: ${margin}\n`;
fs.mkdirSync('psa/reports',{recursive:true}); fs.writeFileSync(`psa/reports/MARGIN_${yyyymm()}.md`, md);
console.log('margin report written');
