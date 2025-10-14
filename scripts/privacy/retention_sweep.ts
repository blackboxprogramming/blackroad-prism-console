import fs from 'fs';
const RET='privacy/retention.json'; if(!fs.existsSync(RET)) process.exit(0);
const o=JSON.parse(fs.readFileSync(RET,'utf-8'));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const md=`# Retention Sweep ${ym}\n\n` + (o.schedules||[]).map((s:any)=>`- ${s.dataset}: rule=${s.rule} owner=${s.owner}`).join('\n') + '\n';
fs.mkdirSync('privacy/reports',{recursive:true}); fs.writeFileSync(`privacy/reports/RETENTION_${ym}.md`, md);
console.log('retention sweep report written');
