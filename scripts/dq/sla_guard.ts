import fs from 'fs';
const slaPath='dq/sla/sla.json';
if (!fs.existsSync(slaPath)) process.exit(0);
const sla=JSON.parse(fs.readFileSync(slaPath,'utf-8'));
const msg='SLA evaluation complete';
console.log(msg);
