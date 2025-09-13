import fs from 'fs';
function yyyymmdd(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; }
const alerts = fs.existsSync('data/soc/alerts.jsonl')? fs.readFileSync('data/soc/alerts.jsonl','utf-8').trim().split('\n').filter(Boolean).length : 0;
const cases  = fs.existsSync('data/soc/cases.jsonl')? fs.readFileSync('data/soc/cases.jsonl','utf-8').trim().split('\n').filter(Boolean).length : 0;
const md = `# SOC Weekly ${yyyymmdd()}

- Alerts seen: ${alerts}
- Cases opened: ${cases}
`;
fs.mkdirSync('soc/reports',{recursive:true}); fs.writeFileSync(`soc/reports/SOC_${yyyymmdd()}.md`, md);
console.log('SOC weekly report written');
