import fs from 'fs';
const OUT='data/obs/rr.jsonl';
if(!fs.existsSync(OUT)) process.exit(0);
const rows=fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const last=rows.slice(-1)[0]||{period:'',services:{}};
const md = `# Reliability Report ${last.period}\n\n` + Object.entries(last.services).map(([s,v]:any)=>`- ${s}: incidents=${v.count}, mttr_s=${v.mttr}, downtime_s=${v.totalDowntime}`).join('\n') + '\n';
fs.mkdirSync('obs/reports',{recursive:true}); fs.writeFileSync(`obs/reports/RR_${(last.period||new Date().toISOString().slice(0,7)).replace('-','')}.md`, md);
console.log('reliability report written');
