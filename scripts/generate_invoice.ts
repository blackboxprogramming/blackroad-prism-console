import fs from 'fs';
import path from 'path';
import mustache from 'mustache';

function today() { return new Date().toISOString().slice(0,10); }
function id()   { return `INV-${today().replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`; }

const base = {
  from: process.env.BILLING_FROM_ENTITY || 'BlackRoad Inc.',
  currency: 'USD',
  terms: 'Net 30'
};

const invoice = {
  id: id(),
  date: today(),
  from: base.from,
  to: { name: 'Example Co', email: 'billing@example.com' },
  items: [{ sku: 'BLACKROAD-PRO', qty: 1, unit: 1200 }],
  currency: base.currency,
  terms: base.terms,
  due_at: new Date(Date.now()+30*86400000).toISOString()
};

invoice['total'] = invoice.items.reduce((s,i)=>s+i.qty*i.unit,0);

const outDir = path.join(process.cwd(), 'invoices');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${invoice.id}.json`), JSON.stringify(invoice, null, 2));

const tpl = fs.readFileSync('data/templates/invoice.mustache','utf-8');
const rendered = mustache.render(tpl, invoice as any);
fs.writeFileSync(path.join(outDir, `${invoice.id}.txt`), rendered);

console.log(`Generated ${invoice.id}`);
