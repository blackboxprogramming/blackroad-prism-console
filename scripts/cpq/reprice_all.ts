import fs from 'fs';
const Q='data/cpq/quotes.jsonl';
if (!fs.existsSync(Q)) process.exit(0);
const rows = fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
for (const q of rows) { if (q.state==='draft' || q.state==='review') { q.pricedAt = Date.now(); } }
fs.writeFileSync(Q, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log('repriced drafts (timestamps only, stub)');
