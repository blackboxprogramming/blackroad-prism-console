import fs from 'fs';
const docs = [
  { id:'pricing', text: fs.existsSync('pricing/catalog.yaml') ? fs.readFileSync('pricing/catalog.yaml','utf-8') : '' },
  { id:'plans', text: fs.existsSync('apps/api/src/routes/billing/plans.ts') ? fs.readFileSync('apps/api/src/routes/billing/plans.ts','utf-8') : '' },
  { id:'docs_pricing', text: fs.existsSync('docs/PRICING.md') ? fs.readFileSync('docs/PRICING.md','utf-8') : '' }
];
fs.mkdirSync('data/search', { recursive: true });
fs.writeFileSync('data/search/index.jsonl', docs.map(d=>JSON.stringify(d)).join('\n')+'\n');
console.log('Indexed', docs.length);
