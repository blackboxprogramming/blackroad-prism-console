import fs from 'fs';
const file = 'data/admin/procurement_pos.json';
const rows = fs.existsSync(file)? JSON.parse(fs.readFileSync(file,'utf-8')):[];
const out = '/tmp/pos_export.csv';
fs.writeFileSync(out, 'number,vendor,amount,currency,status,createdAt\n' + rows.map((r:any)=>[r.number,r.vendor,r.amount,r.currency,r.status,r.createdAt].join(',')).join('\n'));
console.log('wrote', out);
