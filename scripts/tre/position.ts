import fs from 'fs';
const P='data/treasury/positions.jsonl'; const ymd=new Date().toISOString().slice(0,10).replace(/-/g,'');
let md=`# Cash Position ${ymd}\n\n`;
if (fs.existsSync(P)){ const last=fs.readFileSync(P,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-1)[0]; if(last){ last.positions.forEach((p:any)=>{ md+=`- ${p.accountId} ${p.currency} ${p.balance}\n`; }); } }
fs.mkdirSync('treasury/reports',{recursive:true}); fs.writeFileSync(`treasury/reports/POS_${ymd}.md`, md);
console.log('position report written');
