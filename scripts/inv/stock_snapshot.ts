import fs from 'fs';
const TXN='data/inv/txn.jsonl', OUT='data/inv/stock_snap.jsonl';
if (!fs.existsSync(TXN)) process.exit(0);
const rows=fs.readFileSync(TXN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const bySku = rows.reduce((m:any,t:any)=>{ m[t.sku]=m[t.sku]||0; if(t.type==='receipt'||(t.type==='transfer'&&t.to_loc)) m[t.sku]+=Number(t.qty||0); if(t.type==='issue'||(t.type==='transfer'&&t.from_loc)) m[t.sku]-=Number(t.qty||0); if(t.type==='adjust') m[t.sku]+=Number(t.qty||0); return m; },{});
fs.appendFileSync(OUT, JSON.stringify({ ts:Date.now(), stock: bySku })+'\n');
console.log('stock snapshot appended');
