import fs from 'fs';
const S='data/esg/supplier_requests.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Supplier ESG ${ym}\n\n`; let cnt=0;
if(fs.existsSync(S)){ const rows=fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); cnt=rows.length; const recent=rows.slice(-10); recent.forEach(r=>{ md+=`- ${r.type} ${r.vendorId}\n`; }); }
fs.mkdirSync('esg/reports',{recursive:true}); fs.writeFileSync(`esg/reports/SUPPLIERS_${ym}.md`, md);
console.log('supplier digest written', cnt);
