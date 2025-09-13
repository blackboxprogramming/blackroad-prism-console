import fs from 'fs';
const month = new Date().toISOString().slice(0,7).replace('-','');
const out = `partner/reports/RS_${month}.csv`;
fs.mkdirSync('partner/reports', { recursive:true });
fs.writeFileSync(out, "installId,appId,usage,amountUsd\n"); // stub header; populate from warehouse in real impl
console.log('Wrote', out);
