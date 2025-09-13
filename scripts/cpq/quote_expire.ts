import fs from 'fs';
const days = Number(process.env.CPQ_QUOTE_EXPIRE_DAYS||30);
const cutoff = Date.now() + days*86400000; // validity compared on creation for stub
const Q='data/cpq/quotes.jsonl';
if (!fs.existsSync(Q)) process.exit(0);
const rows = fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).map((q:any)=>{
  if (q.validUntil && Date.parse(q.validUntil) < Date.now() && (q.state==='draft'||q.state==='review'||q.state==='approved'||q.state==='sent')) q.state='expired';
  return q;
});
fs.writeFileSync(Q, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log('expired old quotes');
