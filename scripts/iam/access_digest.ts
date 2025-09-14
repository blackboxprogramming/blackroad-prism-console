import fs from 'fs';
const FILE='data/iam/access.jsonl';
if(!fs.existsSync(FILE)) process.exit(0);
const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const open=rows.filter((r:any)=>r.state==='open').length, closed=rows.filter((r:any)=>r.state==='closed').length;
const md=`# Access Digest ${ym}\n\n- Open: ${open}\n- Closed: ${closed}\n`;
fs.mkdirSync('iam/reports',{recursive:true}); fs.writeFileSync(`iam/reports/ACCESS_${ym}.md`, md);
console.log('access digest written');
