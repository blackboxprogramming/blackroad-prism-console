import fs from 'fs';
const REP='data/bcdr/backup_reports.jsonl'; if(!fs.existsSync(REP)) process.exit(0);
const rows=fs.readFileSync(REP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const byId:Record<string,{ok:number,fail:number}>={};
for(const r of rows){ const k=r.id; byId[k]=byId[k]||{ok:0,fail:0}; (r.status==='success'?byId[k].ok++:byId[k].fail++); }
const md = `# Backup Status ${ym}\n\n` + Object.entries(byId).map(([k,v])=>`- ${k}: ok=${v.ok}, fail=${v.fail}`).join('\n') + '\n';
fs.mkdirSync('bcdr/reports',{recursive:true}); fs.writeFileSync(`bcdr/reports/BACKUPS_${ym}.md`, md);
console.log('backup report written');
