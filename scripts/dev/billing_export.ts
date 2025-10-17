
import fs from 'fs';
const M='data/dev/metering.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const out=`data/dev/billing_${ym}.csv`;
let csv='token,api,units,ts\n';
if (fs.existsSync(M)){
  const rows=fs.readFileSync(M,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  rows.forEach((r:any)=>{ csv+=`${r.key},${r.api},${r.units||1},${new Date(r.ts).toISOString()}\n`; });
}
fs.writeFileSync(out, csv);
console.log('billing export written');
