const fs = require('fs');

function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
function count(file){ if (!fs.existsSync(file)) return 0; const data = fs.readFileSync(file,'utf-8').trim(); if (!data) return 0; return data.split('\n').filter(Boolean).length; }

const report = `# Privacy Report ${yyyymm()}

- Consent events: ${count('data/privacy/consent.jsonl')}
- DSAR queue size: ${count('data/privacy/dsar_queue.jsonl')}
- Purges applied per retention policies this month: _see logs_`;

fs.mkdirSync('privacy/reports', { recursive: true });
const out = `privacy/reports/PRIV_${yyyymm()}.md`;
fs.writeFileSync(out, report);
console.log('Wrote', out);
