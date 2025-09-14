import fs from 'fs';
const LOG='data/bcdr/drills.jsonl'; if(!fs.existsSync(LOG)) process.exit(0);
const rows=fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const md = `# Drill Digest ${ym}\n\n` + rows.map((r:any)=>`- ${r.id} ${r.date} outcome=${r.outcome}`).join('\n') + '\n';
fs.mkdirSync('bcdr/reports',{recursive:true}); fs.writeFileSync(`bcdr/reports/DRILLS_${ym}.md`, md);
console.log('drill digest written');
