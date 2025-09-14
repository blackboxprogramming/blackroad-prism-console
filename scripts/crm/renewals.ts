
import fs from 'fs';
const FILE='data/crm/renewals.jsonl';
if (!fs.existsSync(FILE)) process.exit(0);
const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const last=rows.slice(-1)[0]||{};
const md = `# Renewals ${last.period||''}\n\n- Due within days: ${last.due_within_days||0}\n- Count: ${last.count||0}\n- Amount: ${last.amount||0}\n`;
fs.mkdirSync('crm/reports',{recursive:true}); fs.writeFileSync(`crm/reports/RENEW_${new Date().toISOString().slice(0,7).replace('-','')}.md`, md);
console.log('renewals report written');
