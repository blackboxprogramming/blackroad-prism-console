import fs from 'fs';
const R='data/treasury/recon.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Reconciliation ${ym}\n\n`;
if (fs.existsSync(R)){ const rows=fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-20);
  rows.forEach((r:any)=>{ md+=`- ${r.accountId} ${r.period} net=${r.net} (cr=${r.credits}, dr=${r.debits})\n`; });
}
fs.mkdirSync('treasury/reports',{recursive:true}); fs.writeFileSync(`treasury/reports/RECON_${ym}.md`, md);
console.log('recon report written');
