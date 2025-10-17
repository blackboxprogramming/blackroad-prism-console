import fs from 'fs';
const CRQ='data/change/crq.jsonl';
if(!fs.existsSync(CRQ)) process.exit(0);
const rows=fs.readFileSync(CRQ,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-50);
const ym=new Date().toISOString().slice(0,7).replace('-','');
const md='# CAB Digest '+ym+'\n\n'+rows.map((r:any)=>`- ${r.changeId} ${r.title} (${r.state}) window ${r.window?.start}→${r.window?.end}`).join('\n')+'\n';
fs.mkdirSync('change/reports',{recursive:true}); fs.writeFileSync(`change/reports/CAB_${ym}.md`, md);
console.log('cab digest written');
