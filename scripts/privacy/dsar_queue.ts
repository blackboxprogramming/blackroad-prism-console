import fs from 'fs';
const FILE='data/privacy/dsar.jsonl'; if(!fs.existsSync(FILE)) process.exit(0);
const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const open=rows.filter((r:any)=>r.state==='open').length, closed=rows.filter((r:any)=>r.state==='closed').length;
const ym=new Date().toISOString().slice(0,7).replace('-','');
const md=`# DSAR Queue ${ym}\n\n- Open: ${open}\n- Closed: ${closed}\n`;
fs.mkdirSync('privacy/reports',{recursive:true}); fs.writeFileSync(`privacy/reports/DSAR_${ym}.md`, md);
console.log('dsar queue report written');
