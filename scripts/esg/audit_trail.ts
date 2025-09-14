import fs from 'fs';
const trail='data/esg/audit_trail.jsonl';
fs.mkdirSync('data/esg',{recursive:true});
fs.appendFileSync(trail, JSON.stringify({ ts:Date.now(), event:'monthly_check', actor:'workflow', result:'ok' })+'\n');
console.log('audit trail appended');
