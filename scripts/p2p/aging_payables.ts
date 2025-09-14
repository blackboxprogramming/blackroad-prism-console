import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const apP='data/p2p/ap_invoices.jsonl';
const rows = fs.existsSync(apP)? fs.readFileSync(apP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
function daysPast(ts:number){ return Math.floor((Date.now()-ts)/86400000); }
const buckets = { '0-30':0,'31-60':0,'61-90':0,'91+':0 };
for(const i of rows){
  if (i.state==='approved' && i.total>0){
    const age=daysPast(i.ts||Date.now());
    const total=(i.lines||[]).reduce((s,l)=>s+l.qty*l.price,0);
    if (age<=30) buckets['0-30']+=total; else if (age<=60) buckets['31-60']+=total; else if (age<=90) buckets['61-90']+=total; else buckets['91+']+=total;
  }
}
const md = `# AP Aging ${yyyymm()}\n\n${Object.entries(buckets).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n`;
fs.mkdirSync('p2p/reports',{recursive:true}); fs.writeFileSync(`p2p/reports/AP_AGING_${yyyymm()}.md`, md);
console.log('ap aging report written');
