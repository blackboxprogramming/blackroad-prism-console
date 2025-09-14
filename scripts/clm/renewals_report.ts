import fs from 'fs';
const FILE='data/clm/renewals.jsonl';
const lines=fs.existsSync(FILE)?fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const ym=new Date().toISOString().slice(0,7).replace('-','');
const out=['# Renewals Report',...lines.map(r=>`- ${r.contractId} ${r.renewal_date} auto:${r.auto} notice:${r.notice_days}`)];
fs.mkdirSync('clm/reports',{recursive:true});
fs.writeFileSync(`clm/reports/RENEW_${ym}.md`, out.join('\n'));
